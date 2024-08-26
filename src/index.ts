import { outrospectionToQueries } from "./converters.ts";
import { queryCollectionToPostmanCollection } from "./format.ts";
import { fetchIntrospection } from "./lib.ts";
import { outrospect } from "./outrospector.ts";

export { outrospect };

export async function createPostmanCollection(
  url: string,
  headers: Array<[string, string]>,
  authHeader?: [string, string],
) {
  const introspection = await fetchIntrospection(url, headers);
  const outrospection = await outrospect(introspection);

  if (!outrospection || !outrospection.queries) {
    throw new Error("Invalid outrospection data: missing 'queries' property");
  }

  const queryCollection = outrospectionToQueries(outrospection);

  const postmanCollection = queryCollectionToPostmanCollection(
    queryCollection,
    url,
    headers,
    authHeader,
  );

  return postmanCollection;
}
