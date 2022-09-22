import { fetchIntrospection, saveJsonFormatted } from "./lib.ts";
import { outrospect, outrospectionToJSON } from "./outrospect.ts";

export { outrospect };

export async function createPostmanCollection(
  url: string,
  authorization?: string,
) {
  const introspection = await fetchIntrospection(url, authorization);
  const outrospection = outrospect(introspection);
}
