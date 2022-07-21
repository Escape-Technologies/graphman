import {
  createPostmanCollection,
  saveJsonFormatted,
  needsAuth,
  askForAuth,
} from "./lib.ts";

function help() {
  console.log(`Error: not enough arguments.
Usage:
	deno run index.ts [graphql endpoint url]
`);
}

if (Deno.args.length < 1) {
  help();
  Deno.exit(1);
}

const url = Deno.args[0];
const urlRegexp = /https?:\/\/*/;
if (!urlRegexp.test(url)) {
  console.error(`${url} is not a valid url`);
  Deno.exit(1);
}
let authorization;
if (await needsAuth()) {
  authorization = await askForAuth();
}
console.log(`Creating the postman collection for ${url}`);

const collection = await createPostmanCollection(url, authorization);

const outName = collection.info.name + ".postman_collection.json";
saveJsonFormatted(collection, outName);

console.log(`Collection saved as ${outName}`);
console.log(`Import it in postman and complete the queries ! 🚀`);
