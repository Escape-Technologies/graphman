// deno-lint-ignore-file no-explicit-any
// Note: some any types are hard to remove here, because of the recusive types of the introspection
import * as graphql from "https://esm.sh/graphql@16.5.0";

interface PostmanItem {
  name: string;
  request: {
    method: string;
    header: {
      key: string;
      value: string;
    }[];
    body: {
      mode: string;
      graphql: {
        query: string;
        variables: string;
      };
    };
    url: {
      raw: string;
      protocol: string;
      host: string[];
      path: string[];
    };
  };
  response: null[];
}

interface PostmanCollection {
  info: {
    name: string;
    schema: string;
  };
  item: PostmanItem[];
}

function query(url: string, query: string, authorization?: string) {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
    },
    body: JSON.stringify({
      query,
    }),
  }).then((res) => res.json());
}

function findType(
  typeName: string,
  introspectionQuery: graphql.IntrospectionQuery,
): graphql.IntrospectionType | undefined {
  const types = introspectionQuery.__schema.types;
  return types.find((type) => type.name === typeName);
}

export function saveJsonFormatted(json: any, fileName: string) {
  Deno.writeTextFileSync(fileName, JSON.stringify(json, null, "\t"));
}
interface Argument {
  formatedType: string;
  formatedVariable: string;
  defaultValue: string | "null" | "#";
}
interface Field {
  formatedField: string;
  tempField: string; // a hash that will be replaced by the formatedField, after the query is parsed, to keep comments
}

class TypeFormater {
  args = new Map<string, Argument>();
  fileds = new Map<string, Field>();
  introspection: graphql.IntrospectionQuery;

  constructor(introspection: graphql.IntrospectionQuery) {
    this.introspection = introspection;
  }

  getBaseType(type: any): { name: string; kind: string } {
    if (type.kind === "LIST" || type.kind === "NON_NULL") {
      return this.getBaseType(type.ofType);
    } else {
      return { name: type.name, kind: type.kind };
    }
  }

  getDefaultValue(type: string) {
    switch (type) {
      case "ID":
        return `"0"`;
      case "STRING" || "String":
        return `""`;
      case "INT" || "Int":
        return `0`;
      case "FLOAT":
        return `0.0`;
      case "BOOLEAN":
        return `false`;
      case "INPUT_OBJECT":
        return `{}`;
      default:
        return `null`;
    }
  }

  formatArgument(arg: graphql.IntrospectionInputValue): Argument {
    function formatArgType(type: any): string {
      if (type.kind === "SCALAR" || type.kind === "ENUM") {
        return type.name;
      } else if (type.kind === "OBJECT") {
        return type.name;
      } else if (type.kind === "LIST") {
        return `[${formatArgType(type.ofType)}]`;
      } else if (type.kind === "NON_NULL") {
        return `${formatArgType(type.ofType)}!`;
      } else {
        return type.name;
      }
    }

    const formatedType = formatArgType(arg.type);
    const baseType = this.getBaseType(arg.type);
    const defaultNonNullValue = formatedType
      .replace(baseType.name, this.getDefaultValue(baseType.name))
      .replaceAll("!", "");
    const defaultValue = formatedType.includes("!")
      ? defaultNonNullValue
      : "null";
    const formatedArg = {
      defaultValue,
      formatedType,
      formatedVariable: `\t"${arg.name}": ${defaultValue}`,
    };

    this.args.set(arg.name, formatedArg);
    return formatedArg;
  }

  formatField(field: graphql.IntrospectionField): Field {
    if (this.fileds.get(field.name)) {
      return this.fileds.get(field.name) as Field;
    }

    let description = "";
    if (
      field.description &&
      field.description !== "undefined" &&
      field.description !== ""
    ) {
      description = ` # ${field.description?.replace("\n", " ")}`;
    }

    function scalarFormat(field: graphql.IntrospectionField | any) {
      return `${field.name}${description}\n`;
    }

    function objectFormat(field: graphql.IntrospectionField | any) {
      return `# ${field.name}${description}\n`;
    }

    function othersFormat(field: graphql.IntrospectionField | any) {
      return `# ${field.name}${description} # Type: ${field.type?.kind}\n`;
    }

    const baseType = this.getBaseType(field.type);
    let formatedFieldTxt = "";
    if (baseType.kind === "SCALAR" || baseType.kind === "ENUM") {
      formatedFieldTxt = scalarFormat(field);
    } else if (baseType.kind === "OBJECT") {
      formatedFieldTxt = objectFormat(field);
    } else {
      formatedFieldTxt = othersFormat(field);
    }

    const formatedField: Field = {
      formatedField: formatedFieldTxt,
      tempField: `_${globalThis.crypto.randomUUID().split("-")[0]}\n`,
    };

    this.fileds.set(field.name, formatedField);
    return formatedField;
  }
}

function fieldToItem(
  field: graphql.IntrospectionField,
  url: string,
  typeFormater: TypeFormater,
  type: string,
  authorization?: string,
): PostmanItem {
  let queryVarsDefinition = "";
  let fieldVars = "";
  let variables = "";

  // @TODO: remove any types
  field.args.forEach((arg: any, index) => {
    const formatedArg = typeFormater.formatArgument(arg);
    queryVarsDefinition += `${index === 0 ? "" : ","}${
      field.args.length > 3 ? "\n" : " "
    }$${arg.name}: ${formatedArg.formatedType}`;

    fieldVars += `${index === 0 ? "" : ", "}${
      field.args.length > 3 ? "\n" : " "
    }${arg.name}: $${arg.name}`;

    variables += `${index === 0 ? "" : ",\n"}${formatedArg.formatedVariable}`;
  });

  if (field.args.length > 3) {
    queryVarsDefinition += "\n";
    fieldVars += "\n";
  }

  let formatedFields = "__typename\n";

  // @TODO: remove any types
  const _field = field as any;
  const fieldBaseType = typeFormater.getBaseType(_field.type);
  const queryReturnedType = findType(
    fieldBaseType.name,
    typeFormater.introspection,
  ) as graphql.IntrospectionObjectType;

  if (queryReturnedType.kind === "OBJECT") {
    queryReturnedType.fields.forEach((field) => {
      const formatedField = typeFormater.formatField(field);
      formatedFields += formatedField.tempField;
    });
  }

  const hasArgs = field.args.length > 0;
  const hasFields = queryReturnedType.kind === "OBJECT" &&
    queryReturnedType.fields.length > 0;
  const parsed = graphql.parse(
    `${type} ${field.name}${
      hasArgs ? `(${queryVarsDefinition})` : ""
    }{\n${field.name}${hasArgs ? `(${fieldVars})` : ""}${
      hasFields ? `{\n${formatedFields}}` : ""
    }\n}`,
  );
  let itemQuery = graphql.print(parsed);

  if (queryReturnedType.kind === "OBJECT") {
    queryReturnedType.fields.forEach((field) => {
      const formatedField = typeFormater.formatField(field);
      itemQuery = itemQuery.replace(
        formatedField.tempField,
        formatedField.formatedField,
      );
    });
  }

  const formattedVariables = `{\n${variables}\n}`;

  const baseUrl = url.split("//")[1];
  const rootUrl = baseUrl.split("/")[0];
  const path = url.split("//")[1].split("/").slice(1);
  const host = [...rootUrl.split(".")];
  const protocol = url.split("://")[0];

  const postmanItem: PostmanItem = {
    name: field.name,
    request: {
      method: "POST",
      header: [
        ...(authorization
          ? [{ key: "Authorization", value: authorization }]
          : []),
      ],
      body: {
        mode: "graphql",
        graphql: {
          query: itemQuery,
          variables: formattedVariables,
        },
      },
      url: {
        raw: url,
        protocol,
        host,
        path,
      },
    },
    response: [],
  };

  return postmanItem;
}

export async function createPostmanCollection(
  url: string,
  authorization?: string,
) {
  const introspectionQueryString = graphql.getIntrospectionQuery();
  const introspection = await query(
    url,
    introspectionQueryString,
    authorization,
  );
  const introspectionQuery = introspection.data as graphql.IntrospectionQuery;

  const queryTypeName = introspectionQuery.__schema.queryType
    ? introspectionQuery.__schema.queryType.name
    : null;
  const mutationTypeName = introspectionQuery.__schema.mutationType
    ? introspectionQuery.__schema.mutationType.name
    : null;

  const queryType = introspectionQuery.__schema.types.find(
    (type) => type.name === queryTypeName,
  ) as graphql.IntrospectionObjectType | null;

  const mutationType = introspectionQuery.__schema.types.find(
    (type) => type.name === mutationTypeName,
  ) as graphql.IntrospectionObjectType | null;

  const item: PostmanItem[] = [];

  const queryTypeGetter = new TypeFormater(introspectionQuery);

  queryType?.fields.forEach((field) => {
    const postmanItem = fieldToItem(
      field,
      url,
      queryTypeGetter,
      "query",
      authorization,
    );
    item.push(postmanItem);
  });

  mutationType?.fields.forEach((field) => {
    const postmanItem = fieldToItem(
      field,
      url,
      queryTypeGetter,
      "mutation",
      authorization,
    );
    item.push(postmanItem);
  });

  const name = url.split("//")[1].split("/")[0] + "-GraphMan";
  const collection: PostmanCollection = {
    info: {
      name,
      schema:
        "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item,
  };

  return collection;
}
