import { parse } from "https://deno.land/std@0.149.0/flags/mod.ts";
import { saveJsonFormatted } from "./lib.ts";
import { ensureDirSync } from "https://deno.land/std@0.151.0/fs/mod.ts";
import { createPostmanCollection } from "./index.ts";

// @TODO: improve the CLI

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
let path = args.out;
const authorization = args.auth;

const urlRegexp = /https?:\/\/*/;
if (!urlRegexp.test(url)) {
  console.error(`${url} is not a valid url`);
  Deno.exit(1);
}

const pathRegexp = /^(.+)\/([^\/]+).json$/;
if (path && !pathRegexp.test(path)) {
  console.error(`${path} is not a valid path. It must be a json file path.`);
  Deno.exit(1);
}

console.log(`Creating the postman collection for ${url}`);

const collection = await createPostmanCollection(url, authorization);

path = path || "./out/" + collection.info.name + ".postman_collection.json";
path && ensureDirSync("./out/");
saveJsonFormatted(collection, path);
console.log(`Collection saved at ${path}`);

console.log(`Import it in postman and complete the queries ! 🚀`);
