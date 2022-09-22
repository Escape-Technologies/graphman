import { fetchIntrospection, saveJsonFormatted } from "../lib.ts";

const url = "https://rickandmortyapi.com/graphql";
const introspection = await fetchIntrospection(url);
// const {queryType, mutationType} = getQueryAndMutationTypes(introspection);
saveJsonFormatted(introspection, "./out/introspection.json");
