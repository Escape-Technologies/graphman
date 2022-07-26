# GraphMan

<p align="center">
  <img width="300" src="https://raw.githubusercontent.com/Escape-Technologies/graphman/main/graphman.svg">
</p>

_Quickly scaffold a postman collection for a GraphQL API._

GraphMan CLI generates an complete collection from a GraphQL endpoint,
containing one request per query & mutation, with pre filled fields, parameters
and variables.

_Note: GraphMan is designed for the postman-collection spec 2.1_

✨GraphMan is fully compatible with the Insomnia API Client out of the box!✨

## Motivation

Visualizing and exploring existing graphql APIs can be quite daunting. Using
postman to manage all your apis is pretty standard, however creating and
maintaining collections is difficult. GraphMan makes thoses things easy, helping
you for:

- Graph discovery
- Graph testing
- Collection updating

## Usage

_GraphMan uses deno as a javascript / typescript runtime. That allows to run the
CLI from the file url._ To get started:

- [Install deno](https://deno.land/#installation)
- Run:
  `deno run https://raw.githubusercontent.com/Escape-Technologies/graphman/main/src/index.ts <graphql endpoint url>`
- Ask for authorization, type y/Y if authorization is required, else n/N.
- Import the generated `[...].postman_collection.json` file in postman.

However if you want to run the CLI locally, clone the repo and run:
`deno run src/index.ts [url]`

_Note that deno will ask for network and file-system permissions as it's runtime
is secure by default_

### CLI Options
- Custom output filename: `--out=FILNAME`
- Authorization header: `--auth=AUTHORIZATION_HEADER_VALUE`
- Get help: `--help` or `-h`

### Examples

You can try graphman on public graphql APIs, and it is a great way to get
started with graphQL:

- Rick&Morty API:
  `deno run https://raw.githubusercontent.com/Escape-Technologies/graphman/main/src/index.ts https://rickandmortyapi.com/graphql`

| <img width="300" src="https://raw.githubusercontent.com/Escape-Technologies/graphman/main/collection-example.png"> |
| :----------------------------------------------------------------------------------------------------------------: |
|                                  _GraphMan collection for the Rick and morty API_                                  |

| <img width="500" src="https://raw.githubusercontent.com/Escape-Technologies/graphman/main/query-example.png"> |
| :-----------------------------------------------------------------------------------------------------------: |
|                            _Character query for the Rick and morty API collection_                            |

## Issues and contributions

- Please open an issue if you encounter bugs, with reproduction steps and error
  message.
- For feature requests, please open an issue too
- Feel free to create merge requests to improve GraphMan !
