import { fetchIntrospection, saveJsonFormatted } from "./lib.ts";
import { outrospect } from "./outrospector.ts";

export { outrospect };

export async function createPostmanCollection(
  url: string,
  authorization?: string,
) {
  const introspection = await fetchIntrospection(url, authorization);
  const outrospection = outrospect(introspection);
  saveJsonFormatted(outrospection, "outrospection.json");
}
