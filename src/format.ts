import { FormattedQuery, QueryCollection } from "./converters.ts";
import { MockResponse } from "./mock.ts";

interface PostmanRequest {
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
}

interface PostmanResponse {
  name: string;
  originalRequest: PostmanRequest;
  body: string;
  header: null[];
  cookie: null[];
  _postman_previewlanguage: "json";
}
export interface PostmanItem {
  name: string;
  request: PostmanRequest;
  response: (PostmanResponse | null)[];
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
  authorization?: string,
): PostmanItem {
  const baseUrl = url.split("//")[1];
  const rootUrl = baseUrl.split("/")[0];
  const path = url.split("//")[1].split("/").slice(1);
  const host = [...rootUrl.split(".")];
  const protocol = url.split("://")[0];

  const request: PostmanRequest = {
    method: "POST",
    header: [
      ...(authorization
        ? [{ key: "Authorization", value: authorization }]
        : []),
    ],
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
  };

  const postmanItem: PostmanItem = {
    name: query.outrospectQuery.name,
    request: request,
    response: [{
      name: query.outrospectQuery.name,
      originalRequest: request,
      body: JSON.stringify(query.mockResponse, null, 2),
      //body: query.mockResponse,
      header: [],
      cookie: [],
      _postman_previewlanguage: "json",
    }],
  };

  return postmanItem;
}

export function queryCollectionToPostmanCollection(
  queryCollection: QueryCollection,
  url: string,
  authorization?: string,
) {
  const item: PostmanFolder[] = [];
  item.push({ name: "Queries", item: [] });
  queryCollection.queries.forEach((query) => {
    item[0].item.push(queryToItem(query, url, authorization));
  });
  // @TODO: separate queries and mutations in folders
  item.push({ name: "Mutations", item: [] });
  queryCollection.mutations.forEach((query) => {
    item[1].item.push(queryToItem(query, url, authorization));
  });

  const name = url.split("//")[1].split("/")[0] + "-GraphMan";

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
