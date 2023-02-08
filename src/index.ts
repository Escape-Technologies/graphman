import { outrospectionToQueries } from "./converters.ts";
import { queryCollectionToPostmanCollection } from "./format.ts";
import { fetchIntrospection } from "./lib.ts";
import { outrospect } from "./outrospector.ts";

export { outrospect };

export async function createPostmanCollection(
  url: string,
  authorization?: string,
) {
  const introspection = await fetchIntrospection(url, authorization);
  const outrospection = outrospect(introspection);
  const queryCollection = outrospectionToQueries(outrospection);
  const postmanCollection = queryCollectionToPostmanCollection(
    queryCollection,
    url,
    authorization,
  );
  return { postmanCollection, outrospection, introspection };
}
