import { fetchIntrospection, saveJsonFormatted } from "./lib.ts";
import { outrospect, outrospectionToJSON } from "./outrospect.ts";

const introspection = await fetchIntrospection(
  "https://rickandmortyapi.com/graphql",
);
// const {queryType, mutationType} = getQueryAndMutationTypes(introspection);
const outrospection = outrospect(introspection);
const outrospectionJSON = outrospectionToJSON(outrospection);
saveJsonFormatted(outrospectionJSON, "./out/outrospection.json");
