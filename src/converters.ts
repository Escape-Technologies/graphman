import { parse, print } from "https://esm.sh/v90/graphql@16.5.0";
import { generateMockData, getDefaultTypeValue, MockResponse } from "./mock.ts";
import { Argument, ObjectField, Outrospection, Query } from "./outrospector.ts";

export interface FormattedArgument {
  formattedType: string;
  formattedVariable: string;
  defaultValue: string | "null" | "#";
}

export interface FormattedField {
  formatedField: string;
  tempField: string; // a hash that will be replaced by the formatedField, after the query is parsed, to keep comments
}

export interface FormattedQuery {
  args: FormattedArgument[];
  fields: FormattedField[];
  fullQuery: string;
  variables: string;
  outrospectQuery: Query;
  mockResponse: MockResponse;
}

export interface QueryCollection {
  queries: FormattedQuery[];
  mutations: FormattedQuery[];
}

function nestedArgToString(arg: Argument, argStr?: string): string {
  if (!argStr) argStr = arg.typeName;
  if (arg.nesting.length === 0) {
    return argStr;
  } else {
    const nesting = arg.nesting.pop();
    if (nesting === "LIST") {
      return `[${nestedArgToString(arg, argStr)}]`;
    } else if (nesting === "NON_NULL") {
      return `${nestedArgToString(arg, argStr)}!`;
    }
  }
  return argStr;
}

function formatArgument(arg: Argument): FormattedArgument {
  const formattedType: string = nestedArgToString(arg);

  const defaultNonNullValue = formattedType
    .replace(arg.typeName, String(getDefaultTypeValue(arg.typeName)))
    .replaceAll("!", "");
  const defaultValue = formattedType.includes("!")
    ? defaultNonNullValue
    : "null";

  return {
    defaultValue,
    formattedType,
    formattedVariable: `\t"${arg.name}": ${defaultValue}`,
  };
}

function formatField(field: ObjectField): FormattedField {
  let description = "";
  if (
    field.description &&
    field.description !== "undefined" &&
    field.description !== ""
  ) {
    description = ` # ${field.description?.replace("\n", " ")}`;
  }

  function scalarFormat(field: ObjectField) {
    return `${field.name}${description}\n`;
  }

  function objectFormat(field: ObjectField) {
    return `# ${field.name}${description}\n`;
  }

  function othersFormat(field: ObjectField) {
    return `# ${field.name}${description} # Type: ${field.typeBaseKind}\n`;
  }

  let formattedFieldStr = "";
  if (field.typeBaseKind === "SCALAR" || field.typeBaseKind === "ENUM") {
    formattedFieldStr = scalarFormat(field);
  } else if (field.typeBaseKind === "OBJECT") {
    formattedFieldStr = objectFormat(field);
  } else {
    formattedFieldStr = othersFormat(field);
  }

  const formattedField: FormattedField = {
    formatedField: formattedFieldStr,
    tempField: `_${crypto.randomUUID().split("-")[0]}\n`,
  };

  return formattedField;
}

class FormattedFieldBuffer {
  formattedFields = new Map<string, FormattedField>();
  outrospection: Outrospection;

  constructor(outrospection: Outrospection) {
    this.outrospection = outrospection;
  }

  formatField(field: ObjectField): FormattedField {
    if (this.formattedFields.get(field.name)) {
      return this.formattedFields.get(field.name) as FormattedField;
    } else {
      const formattedField = formatField(field);
      this.formattedFields.set(field.name, formattedField);
      return formattedField;
    }
  }
}

function formatQuery(
  query: Query,
  is: "query" | "mutation",
  outrospection: Outrospection,
): FormattedQuery {
  let queryVarsDefinition = "";
  let fieldVars = "";
  let variables = "";

  const formattedFieldBuffer = new FormattedFieldBuffer(outrospection);

  const formattedQuery: FormattedQuery = {
    args: [],
    fields: [],
    fullQuery: "",
    variables: "",
    outrospectQuery: query,
    mockResponse: generateMockData(query, outrospection),
  };

  Array.from(query.args).forEach(([_, arg], index) => {
    const formatedArg = formatArgument(arg);
    formattedQuery.args.push(formatedArg);
    queryVarsDefinition += `${index === 0 ? "" : ","}${
      query.args.size > 3 ? "\n" : " "
    }$${arg.name}: ${formatedArg.formattedType}`;

    fieldVars += `${index === 0 ? "" : ", "}${
      query.args.size > 3 ? "\n" : " "
    }${arg.name}: $${arg.name}`;

    variables += `${index === 0 ? "" : ",\n"}${formatedArg.formattedVariable}`;
  });

  formattedQuery.variables = `{\n${variables}\n}`;

  if (query.args.size > 3) {
    queryVarsDefinition += "\n";
    fieldVars += "\n";
  }

  let formatedFields = "__typename\n";

  const returnType = outrospection.types.get(query.typeName);
  if (!returnType) {
    throw new Error(`Type ${query.typeName} not found in outrospection`);
  }
  if (returnType && returnType.kind === "OBJECT") {
    returnType.fields?.forEach((field) => {
      const formatedField = formattedFieldBuffer.formatField(field);
      formattedQuery.fields.push(formatedField);
      formatedFields += formatedField.tempField;
    });
  }

  const hasArgs = query.args.size > 0;
  const hasFields = returnType.kind === "OBJECT" &&
    returnType.fields && returnType.fields?.length > 0;

  const parsed = parse(
    `${is} ${query.name}${
      hasArgs ? `(${queryVarsDefinition})` : ""
    }{\n${query.name}${hasArgs ? `(${fieldVars})` : ""}${
      hasFields ? `{\n${formatedFields}}` : ""
    }\n}`,
  );

  formattedQuery.fullQuery = print(parsed);

  if (returnType.kind === "OBJECT") {
    returnType.fields?.forEach((field) => {
      const formatedField = formattedFieldBuffer.formatField(field);
      formattedQuery.fullQuery = formattedQuery.fullQuery.replace(
        formatedField.tempField,
        formatedField.formatedField,
      );
    });
  }

  return formattedQuery;
}

export function outrospectionToQueries(
  outrospection: Outrospection,
): QueryCollection {
  const collection: QueryCollection = {
    queries: [],
    mutations: [],
  };

  outrospection.queries.forEach((query) => {
    collection.queries.push(formatQuery(query, "query", outrospection));
  });

  outrospection.mutations.forEach((query) => {
    collection.queries.push(formatQuery(query, "mutation", outrospection));
  });

  return collection;
}
