import { fetchIntrospection, saveJsonFormatted } from "./lib.ts";
import { outrospect } from "./outrospector.ts";

const introspection = await fetchIntrospection(
  "https://rickandmortyapi.com/graphql",
);
// const {queryType, mutationType} = getQueryAndMutationTypes(introspection);
const outrospection = outrospect(introspection);
saveJsonFormatted(outrospection, "outrospection.json");
