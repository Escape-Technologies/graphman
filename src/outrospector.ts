// deno-lint-ignore-file no-explicit-any
import {
  IntrospectionInputValue,
  IntrospectionObjectType,
  IntrospectionQuery,
  IntrospectionType,
  IntrospectionUnionType,
} from "https://esm.sh/v90/graphql@16.5.0";
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

export interface ObjectField {
  name: string;
  description: string | undefined;
  typeName: string;
  typeBaseKind: TypeBaseKind;
}

interface Type {
  name: string;
  kind: TypeBaseKind;
  fields: ObjectField[] | undefined;
  possibleTypes: string[] | undefined;
  description: string | undefined;
}

export interface Argument {
  name: string;
  typeBaseKind: TypeBaseKind;
  typeName: string;
  description: string | undefined;
  nesting: ("NON_NULL" | "LIST")[];
}

export interface Query {
  name: string;
  description: string | undefined;
  typeName: string;
  args: Map<string, Argument>;
}

export interface Outrospection {
  queryTypeName: string | undefined;
  mutationTypeName: string | undefined;
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
  introspection: IntrospectionQuery,
  outrospection: Outrospection,
): Type {
  if (
    !(introspectionType.kind === "OBJECT" ||
      introspectionType.kind === "INTERFACE" ||
      introspectionType.kind === "UNION" ||
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
    possibleTypes: undefined,
    description: introspectionType.description ?? undefined,
  };

  if (
    type.kind === "OBJECT" || type.kind === "INTERFACE"
  ) {
    type.fields = [];
    const introspectionObjectType =
      introspectionType as IntrospectionObjectType;
    introspectionObjectType.fields.forEach((field) => {
      const fieldType = field.type as IntrospectionType;
      type.fields?.push({
        name: field.name,
        description: field.description?.replaceAll("\n", " ") ?? undefined,
        typeName: fieldType.name,
        typeBaseKind: getBaseType(field.type).typeBaseKind,
      });
    });
  }

  if (type.kind === "UNION") {
    type.possibleTypes = [];
    const introspectionObjectType = introspectionType as IntrospectionUnionType;
    // @todo: this could be simplified, see later todo
    introspectionObjectType.possibleTypes.forEach((possibleType) => {
      type.possibleTypes?.push(possibleType.name);
      const parsedPossibleType = parseType(
        getTypeFromIntrospection(possibleType.name, introspection),
        introspection,
        outrospection,
      );
      outrospection.types.set(possibleType.name, parsedPossibleType);
    });
  }

  return type;
}

function getBaseType(
  // @ TODO: fix this type
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
  const { queryType, mutationType } = getQueryAndMutationTypes(introspection);

  const outrospection: Outrospection = {
    queryTypeName: queryType?.name,
    mutationTypeName: mutationType?.name,
    queries: [],
    mutations: [],
    types: new Map<string, Type>(),
  };

  function parseQueryOrMutationType(
    queryOrMutationType: IntrospectionObjectType,
    is: "query" | "mutation",
  ) {
    //@todo we should parse all types here rather than just the ones that are used in queries and mutations
    // this would simplify the code for unions and interfaces
    queryOrMutationType?.fields.forEach((field) => {
      const baseType = getBaseType(field.type);
      const introspectionType = getTypeFromIntrospection(
        baseType.typeName,
        introspection,
      );
      const type = parseType(introspectionType, introspection, outrospection);
      outrospection.types.set(type.name, type);
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
  const queryTypeName = outrospection.queryTypeName;
  const mutationTypeName = outrospection.mutationTypeName;

  queries.forEach((query: any) => {
    query.args = Object.fromEntries(query.args);
  });
  mutations.forEach((query: any) => {
    query.args = Object.fromEntries(query.args);
  });
  return { queryTypeName, mutationTypeName, queries, mutations, types };
}
