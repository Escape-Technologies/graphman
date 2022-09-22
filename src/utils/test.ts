import { outrospectionToQueries } from "../converters.ts";
import { queryCollectionToPostmanCollection } from "../format.ts";
import { fetchIntrospection, saveJsonFormatted } from "../lib.ts";
import { outrospect } from "../outrospector.ts";

const url = "https://rickandmortyapi.com/graphql";

const introspection = await fetchIntrospection(url);
const outrospection = outrospect(introspection);
const queryCollection = outrospectionToQueries(outrospection);
const postmanCollection = queryCollectionToPostmanCollection(
  queryCollection,
  url,
);

saveJsonFormatted(postmanCollection, "./out/testPostmanCollection.json");
