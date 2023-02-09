import {
  getIntrospectionQuery,
  IntrospectionObjectType,
  IntrospectionQuery,
} from "https://esm.sh/v90/graphql@16.5.0";

export function parseHeaders(rawHeaders: [string] | undefined) {
  const parsed: Record<string, string> = {};
  if (!rawHeaders || !rawHeaders.length) return parsed;
  for (const h of rawHeaders) {
    try {
      const [key, value] = h.split(":");
      parsed[key.trim()] = value.trim();
    } catch {
      throw new Error(
        `\n\nError parsing: \n ${h}. \n Please verify your headers.\n`,
      );
    }
  }
  return parsed;
}

async function query(
  url: string,
  query: string,
  headers?: Record<string, string>,
) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...headers,
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
  headers?: Record<string, string>,
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
