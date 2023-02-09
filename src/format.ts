import { FormattedQuery, QueryCollection } from "./converters.ts";

export interface PostmanItem {
  name: string;
  request: {
    method: string;
    header: {
      key: string;
      value: string;
    }[];
    body: {
      mode: string;
      graphql: {
        query: string;
        variables: string;
      };
    };
    url: {
      raw: string;
      protocol: string;
      host: string[];
      path: string[];
    };
    description: string | null;
  };
  response: null[];
}

export interface PostmanFolder {
  name: string;
  item: PostmanItem[];
}

export interface PostmanCollection {
  info: {
    name: string;
    schema: string;
  };
  item: PostmanFolder[];
}

function queryToItem(
  query: FormattedQuery,
  url: string,
  headers?: Record<string, string>,
): PostmanItem {
  const baseUrl = url.split("//")[1];
  const rootUrl = baseUrl.split("/")[0];
  const path = url.split("//")[1].split("/").slice(1);
  const host = [...rootUrl.split(".")];
  const protocol = url.split("://")[0];

  const postmanItem: PostmanItem = {
    name: query.outrospectQuery.name,
    request: {
      method: "POST",
      header: Object.entries(headers ?? {}).map(([key, value]) => ({
        key,
        value,
      })),
      body: {
        mode: "graphql",
        graphql: {
          query: query.fullQuery,
          variables: query.variables,
        },
      },
      url: {
        raw: url,
        protocol,
        host,
        path,
      },
      description: query.outrospectQuery.description ?? null,
    },
    response: [],
  };

  return postmanItem;
}

export function queryCollectionToPostmanCollection(
  queryCollection: QueryCollection,
  url: string,
  headers?: Record<string, string>,
) {
  const item: PostmanFolder[] = [];
  item.push({ name: "Queries", item: [] });
  queryCollection.queries.forEach((query) => {
    item[0].item.push(queryToItem(query, url, headers));
  });
  // @TODO: separate queries and mutations in folders
  item.push({ name: "Mutations", item: [] });
  queryCollection.mutations.forEach((query) => {
    item[1].item.push(queryToItem(query, url, headers));
  });

  const name = url.split("//")[1].split("/")[0] + "-GraphMan";
  const invalidCharacters = /[^a-zA-Z0-9-_.]/g;
  // replace invalid characters with underscore
  name.replace(invalidCharacters, "_");

  const collection: PostmanCollection = {
    info: {
      name,
      schema:
        "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item,
  };

  return collection;
}
