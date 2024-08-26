import {
  getIntrospectionQuery,
  IntrospectionObjectType,
  IntrospectionQuery,
} from "https://esm.sh/v90/graphql@16.5.0";

export function parseHeader(h: string): [string, string] {
  const [key, value] = h.split(":", 2);
  if (key && value) return [key.trim(), value.trim()];
  throw new Error(`Error parsing header: ${h}`);
}

export function parseHeaders(headers: string[]): Array<[string, string]> {
  return headers.map(parseHeader);
}

async function query(
  url: string,
  query: string,
  headers: Array<[string, string]>,
) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...Object.fromEntries(headers || []),
      },
      body: JSON.stringify({
        query,
      }),
    });
    return await res.json();
  } catch {
    throw new Error(
      "\n\nError fetching introspection query. \n Please verify your URL, authorization, and network connection.\n",
    );
  }
}

// deno-lint-ignore no-explicit-any
export function saveJsonFormatted(json: any, path: string) {
  Deno.writeTextFileSync(path, JSON.stringify(json, null, "\t"), {
    create: true,
  });
}

export async function fetchIntrospection(
  url: string,
  headers: Array<[string, string]>,
) {
  const introspectionQueryString = getIntrospectionQuery();

  const introspection = await query(
    url,
    introspectionQueryString,
    headers,
  );
  if (!introspection.data) {
    throw new Error(
      "\n\nError fetching introspection query. \n Please verify your URL, authorization, and network connection.\n",
    );
  }
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
