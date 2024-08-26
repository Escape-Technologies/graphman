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
  auth?: {
    type: string;
    apikey: {
      key: string;
      value: string;
      type: string;
    }[];
  };
}

function queryToItem(
  query: FormattedQuery,
  url: string,
  headers: Array<[string, string]>,
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
      header: headers.map(([key, value]) => ({
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
  headers: Array<[string, string]>,
  authHeader?: [string, string],
): PostmanCollection {
  const item: PostmanFolder[] = [];

  if (queryCollection.queries && queryCollection.queries.length > 0) {
    item.push({ name: "Queries", item: [] });
    queryCollection.queries.forEach((query) => {
      item[0].item.push(queryToItem(query, url, headers));
    });
  }

  if (queryCollection.mutations && queryCollection.mutations.length > 0) {
    item.push({ name: "Mutations", item: [] });
    queryCollection.mutations.forEach((query) => {
      item[1].item.push(queryToItem(query, url, headers));
    });
  }

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

  if (authHeader) {
    collection.auth = {
      type: "apikey",
      apikey: [
        { key: "in", value: "header", type: "string" },
        { key: "value", value: authHeader[1], type: "string" },
        { key: "key", value: authHeader[0], type: "string" },
      ],
    };
  }

  return collection;
}
