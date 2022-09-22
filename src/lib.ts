import {
  getIntrospectionQuery,
  IntrospectionObjectType,
  IntrospectionQuery,
} from "https://esm.sh/v90/graphql@16.5.0";

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

export function saveJsonFormatted(json: any, path: string) {
  Deno.writeTextFileSync(path, JSON.stringify(json, null, "\t"), {
    create: true,
  });
}

export async function fetchIntrospection(url: string, authorization?: string) {
  const introspectionQueryString = getIntrospectionQuery();
  const introspection = await query(
    url,
    introspectionQueryString,
    authorization,
  );
  return introspection.data as IntrospectionQuery;
}

export function getQueryAndMutationTypes(
  introspection: IntrospectionQuery,
) {
  const queryTypeName = introspection.__schema.queryType
    ? introspection.__schema.queryType.name
    : null;
  const mutationTypeName = introspection.__schema.mutationType
    ? introspection.__schema.mutationType.name
    : null;

  const queryType = introspection.__schema.types.find(
    (type) => type.name === queryTypeName,
  ) as IntrospectionObjectType | null;

  const mutationType = introspection.__schema.types.find(
    (type) => type.name === mutationTypeName,
  ) as IntrospectionObjectType | null;

  return { queryType, mutationType };
}
