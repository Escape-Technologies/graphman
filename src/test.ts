import { outrospectionToQueries } from "./converters.ts";
import { queryCollectionToPostmanCollection } from "./format.ts";
import { fetchIntrospection, saveJsonFormatted } from "./lib.ts";
import { outrospect, outrospectionToJSON } from "./outrospector.ts";

const url = "https://rickandmortyapi.com/graphql";

const introspection = await fetchIntrospection(url);
// const {queryType, mutationType} = getQueryAndMutationTypes(introspection);
const outrospection = outrospect(introspection);
// const outrospectionJSON = outrospectionToJSON(outrospection);
// saveJsonFormatted(outrospectionJSON, "./out/outrospection.json");

const queryCollection = outrospectionToQueries(outrospection);
// saveJsonFormatted(queryCollection, "./out/queryCollection.json");

const postmanCollection = queryCollectionToPostmanCollection(
  queryCollection,
  url,
);

saveJsonFormatted(postmanCollection, "./out/postmanCollection.json");
