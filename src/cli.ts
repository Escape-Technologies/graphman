import { parse } from "https://deno.land/std@0.149.0/flags/mod.ts";
import { parseHeaders, saveJsonFormatted } from "./lib.ts";
import {
  ensureDirSync,
  ensureFileSync,
} from "https://deno.land/std@0.151.0/fs/mod.ts";
import { createPostmanCollection } from "./index.ts";

// @TODO: improve the CLI

function help() {
  console.log(`Error: not enough arguments.
Usage:
  deno run index.ts <GRAPHQL_ENDPOINT_URL>
Options:
  --out=OUTPUT_FILE  Output file path
  -H="header: value"  Header to add to the request, the flag can be used multiple times.
  --AuthHeader="header: value", -A="header: value"  Global header for Postman collection authorization.
Help:
  deno run index.ts [--help | -h]
`);
}

const args = parse(Deno.args, {
  boolean: ["help", "h"],
  collect: ["H"],
  string: ["AuthHeader", "A"],
  alias: {
    AuthHeader: "A",
  },
}) as {
  _: [string];
  help?: boolean;
  h?: boolean;
  out?: string;
  H?: [string];
  AuthHeader?: string;
  A?: string;
};

if (Deno.args.length < 1 || args.help || args.h) {
  help();
  Deno.exit(1);
}

const url = args._[0];
let path = args.out;

const headers = parseHeaders(args.H || []);

// Handle the AuthHeader separately
const authHeader = (args.AuthHeader ?? args.A)
  ? (args.AuthHeader ?? args.A)!.split(": ", 2) as [string, string]
  : undefined;

if (authHeader) {
  headers.push(authHeader); // Add AuthHeader to headers for API access
}

const urlRegexp = /https?:\/\/*/;
if (!urlRegexp.test(url)) {
  console.error(`${url} is not a valid url`);
  Deno.exit(1);
}

console.log(`Creating the Postman collection for ${url}`);

const postmanCollection = await createPostmanCollection(
  url,
  headers,
  authHeader,
);

path = path ||
  "./out/" + postmanCollection.info.name + ".postman_collection.json";
path && ensureDirSync("./out/");
try {
  !path && ensureFileSync(path);
} catch (e) {
  console.error(`Error: ${e.message}`);
  Deno.exit(1);
}
saveJsonFormatted(postmanCollection, path);
console.log(`Collection saved at ${path}`);

console.log(`Import it in Postman and complete the queries! 🚀`);
