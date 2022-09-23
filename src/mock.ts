// The goal of this module is to generate fake data for types, for variables and mock responses

import { Outrospection, Query } from "./outrospector.ts";

const defaultValues = {
  ID: "1",
  String: "",
  STRING: "",
  Int: 0,
  INT: 0,
  Float: 0.0,
  FLOAT: 0.0,
  Boolean: false,
  BOOLEAN: false,
  INPUT_OBJECT: {},
  OBJECT: {},
};

const defaultScalarValue = "1";

export function getDefaultTypeValue(typeName: string) {
  return Object(defaultValues)[typeName] ?? null;
}

export interface MockResponse {
  data: {
    // deno-lint-ignore no-explicit-any
    [key: string]: any;
  };
}

export function generateMockData(
  query: Query,
  outrospection: Outrospection,
): MockResponse {
  const mockData = new Map<string, string>();

  const type = outrospection.types.get(query.typeName);
  if (!type) {
    throw new Error(`Type ${query.typeName} not found in outrospection`);
  }

  if (type.kind === "OBJECT") {
    type.fields?.forEach((field) => {
      mockData.set(field.name, getDefaultTypeValue(field.typeName));
    });
  } else if (type.kind === "SCALAR") {
    mockData.set(type.name, defaultScalarValue);
  } else {
    //@TODO: handle other types if needed
    mockData.set(
      "notImplemented",
      `Mock data for return type ${type.kind} is not implemented yet`,
    );
  }

  const mock = {
    data: {
      [query.name]: {
        "__typename": query.typeName,
        ...Object.fromEntries(mockData),
      },
    },
  };
  return mock;
}
