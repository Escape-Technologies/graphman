# GraphMan
*Quikly scaffold a postman collection for a GraphQL API.* 

GraphMan CLI generates an complete collection from a GraphQL endpoint, containing one request per query & mutation, with pre filled fields, parameters and variables. 

*Note: GraphMan is designed for the postman-collection spec 2.1*

## Motivation
Visualizing and exploring existing graphql APIs can be quite daunting. 
Using postman to manage all your apis is pretty standard, however creating and maintaining collections is difficult.
GraphMan makes thoses things easy, helping you for:
- Graph discovery
- Graph testing
- Collection updating

## Usage
*GraphMan uses deno as a javascript / typescript runtime. That allows to run the CLI from the file url.*
To get started:
- [Install deno](https://deno.land/#installation)
- Run: `TODO after upload`
- Import the generated `[...].postman_collection.json` file in postman.

However if you want to run the CLI locally, clone the repo and run: `deno run src/index.ts [url]`

*Note that deno will ask for network and file-system permissions as it's runtime is secure by default*

### Examples
You can try graphman on public graphql APIs, and it is a great way to get started with graphQL:
- Rick&Morty API: 
- StarWars API: 

## Issues and contributions
- Please open an issue if you encounter bugs, with reproduction steps and error message.
- For feature requests, please open an issue too
- Feel free to create merge requests to improve GraphMan !

