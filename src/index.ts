import { outrospectionToQueries } from "./converters.ts";
import { queryCollectionToPostmanCollection } from "./format.ts";
import { fetchIntrospection } from "./lib.ts";
import { outrospect } from "./outrospector.ts";

export { outrospect };

export async function createPostmanCollection(
  url: string,
  headers?: Record<string, string>,
) {
  const introspection = await fetchIntrospection(url, headers);
  const outrospection = outrospect(introspection);
  const queryCollection = outrospectionToQueries(outrospection);
  const postmanCollection = queryCollectionToPostmanCollection(
    queryCollection,
    url,
    headers,
  );
  return { postmanCollection, outrospection, introspection };
}
