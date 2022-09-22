import { fetchIntrospection, saveJsonFormatted } from "./lib.ts";


const introspection = await fetchIntrospection("https://rickandmortyapi.com/graphql");
// const {queryType, mutationType} = getQueryAndMutationTypes(introspection);
saveJsonFormatted(introspection, "introspection.json");