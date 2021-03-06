import { createPostmanCollection, saveJsonFormatted } from "./lib.ts";
import { parse } from "https://deno.land/std@0.149.0/flags/mod.ts";

function help() {
  console.log(`Error: not enough arguments.
Usage:
	deno run index.ts <GRAPHQL_ENDPOINT_URL> {--out=OUTPUT_FILE, --authorization=AUTHORIZATION_HEADER}
Help:
  deno run index.ts [--help | -h]
`);
}

const args = parse(Deno.args, { boolean: ["help", "h"] }) as {
  _: [string];
  help?: boolean;
  h?: boolean;
  out?: string;
  auth?: string;
};

if (Deno.args.length < 1 || args.help || args.h) {
  help();
  Deno.exit(1);
}

const url = args._[0];
const filename = args.out;
const authorization = args.auth;

const urlRegexp = /https?:\/\/*/;
if (!urlRegexp.test(url)) {
  console.error(`${url} is not a valid url`);
  Deno.exit(1);
}
console.log(`Creating the postman collection for ${url}`);

const collection = await createPostmanCollection(url, authorization);

const outName = filename || collection.info.name + ".postman_collection.json";
saveJsonFormatted(collection, outName);

console.log(`Collection saved as ${outName}`);
console.log(`Import it in postman and complete the queries ! 🚀`);
