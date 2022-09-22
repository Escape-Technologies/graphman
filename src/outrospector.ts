import {
  IntrospectionInputValue,
  IntrospectionObjectType,
  IntrospectionOutputType,
  IntrospectionQuery,
  IntrospectionType,
} from "https://esm.sh/v90/graphql@16.5.0/index.d.ts";
import { getQueryAndMutationTypes } from "./lib.ts";

// @TODO add real support for "INTERFACE" | "UNION" | "INPUT_OBJECT"
type TypeBaseKind =
  | "LIST"
  | "NON_NULL"
  | "SCALAR"
  | "ENUM"
  | "OBJECT"
  | "INTERFACE"
  | "UNION";

interface ObjectField {
  name: string;
  description: string | undefined;
  typeName: string;
  typeBaseKind: TypeBaseKind;
}

interface Type {
  name: string;
  kind: TypeBaseKind;
  fields: ObjectField[] | undefined;
  description: string | undefined;
}

interface Argument {
  name: string;
  typeBaseKind: TypeBaseKind;
  typeName: string;
  description: string | undefined;
  nesting: ("NON_NULL" | "LIST")[];
}

interface Query {
  name: string;
  description: string | undefined;
  typeName: string;
  args: Map<string, Argument>;
}

interface Outrospection {
  queries: Query[];
  mutations: Query[];
  // @ TODO: subscriptions
  types: Map<string, Type>;
}

function getTypeFromIntrospection(
  typeName: string,
  introspection: IntrospectionQuery,
) {
  const type = introspection.__schema.types.find((type) =>
    type.name === typeName
  );
  if (!type) {
    throw new Error(`Type ${typeName} not found`);
  }
  return type;
}

function parseType(
  introspectionType: IntrospectionType,
): Type {
  if (
    !(introspectionType.kind === "OBJECT" ||
      introspectionType.kind === "ENUM" ||
      introspectionType.kind === "SCALAR")
  ) {
    throw new Error(
      `Kind ${introspectionType.kind} for type ${introspectionType.name} is not supported yet. Please open an issue.`,
    );
  }

  const type: Type = {
    name: introspectionType.name,
    kind: introspectionType.kind,
    fields: undefined,
    description: introspectionType.description ?? undefined,
  };

  if (type.kind === "OBJECT") {
    type.fields = [];
    const introspectionObjectType =
      introspectionType as IntrospectionObjectType;
    introspectionObjectType.fields.forEach((field) => {
      const fieldType = field.type as IntrospectionType;
      type.fields?.push({
        name: field.name,
        description: field.description ?? undefined,
        typeName: fieldType.name,
        typeBaseKind: field.type.kind,
      });
    });
  }

  return type;
}

function getBaseType(
  // @ TODO: fix this type
  // deno-lint-ignore no-explicit-any
  type: any,
  nesting?: ("NON_NULL" | "LIST")[],
): {
  typeName: string;
  typeBaseKind: TypeBaseKind;
  nesting: ("NON_NULL" | "LIST")[];
} {
  if (nesting === undefined) nesting = [];
  if (type.kind === "LIST" || type.kind === "NON_NULL") {
    nesting.push(type.kind);
    return getBaseType(type.ofType, nesting);
  } else {
    return { typeName: type.name, typeBaseKind: type.kind, nesting };
  }
}

function parseArg(
  introspectionArg: IntrospectionInputValue,
): Argument {
  const { typeBaseKind, typeName, nesting } = getBaseType(
    introspectionArg.type,
  );

  const arg: Argument = {
    name: introspectionArg.name,
    typeBaseKind,
    typeName,
    description: introspectionArg.description ?? undefined,
    nesting,
  };

  return arg;
}

export function outrospect(introspection: IntrospectionQuery): Outrospection {
  const outrospection: Outrospection = {
    queries: [],
    mutations: [],
    types: new Map<string, Type>(),
  };

  const { queryType, mutationType } = getQueryAndMutationTypes(introspection);

  function parseQueryOrMutationType(
    queryOrMutationType: IntrospectionObjectType,
    is: "query" | "mutation",
  ) {
    queryOrMutationType?.fields.forEach((field) => {
      const baseType = getBaseType(field.type);
      const introspectionType = getTypeFromIntrospection(
        baseType.typeName,
        introspection,
      );
      const type = parseType(introspectionType);
      outrospection.types.set(type.name, type);
      console.log("type", type);
      const query: Query = {
        name: field.name,
        description: field.description ?? undefined,
        typeName: type.name, //@TODO here it might be a list
        args: new Map<string, Argument>(),
      };

      field.args.forEach((arg: IntrospectionInputValue) => {
        query.args.set(arg.name, parseArg(arg));
      });

      if (is === "query") {
        outrospection.queries.push(query);
      }
      if (is === "mutation") {
        outrospection.mutations.push(query);
      }
    });
  }

  if (queryType) parseQueryOrMutationType(queryType, "query");
  if (mutationType) parseQueryOrMutationType(mutationType, "mutation");

  return outrospection;
}

export function outrospectionToJSON(outrospection: Outrospection) {
  const queries: any = outrospection.queries;
  const mutations: any = outrospection.mutations;
  const types: any = Object.fromEntries(outrospection.types);

  queries.forEach((query: any) => {
    query.args = Object.fromEntries(query.args);
  });
  mutations.forEach((query: any) => {
    query.args = Object.fromEntries(query.args);
  });
  return { queries, mutations, types };
}
