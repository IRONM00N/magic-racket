/* eslint-disable @typescript-eslint/ban-ts-comment, dot-notation, @typescript-eslint/no-var-requires */
// @ts-check

const yaml = require("js-yaml");
const { readFile, writeFile } = require("node:fs/promises");
const path = require("node:path");
const assert = require("node:assert/strict");
const { inspect } = require("node:util");

const concatType = new yaml.Type("!concat", {
  kind: "sequence", // array
  resolve: (data) => data !== null && Array.isArray(data),
  construct: (data) => {
    assert(Array.isArray(data));
    for (const elem of data) {
      if (typeof elem === "undefined") continue;
      assert(typeof elem === "string", `expected a string, got ${inspect(elem)}`);
    }
    return data.join("");
  },
  represent: (data) => data,
});

const customSchema = yaml.DEFAULT_SCHEMA.extend([concatType]);

const full = (/** @type {string} */ str) => path.join(__dirname, str);

const paths = [
  [full("./src/racket.yaml"), full("./racket.tmLanguage.json")],
  [full("./src/racket.original.yaml"), full("./racket.original.tmLanguage.json")],
];

(async () => {
  for (const [source, destination] of paths) {
    const content = (await readFile(source, "utf8")).toString();
    const data = yaml.load(content, { schema: customSchema });

    // remove top-level anchors key, so that there is an easy way to declare anchors
    // @ts-ignore
    data["anchors"] = undefined;

    const json = JSON.stringify(data, null, 2);

    await writeFile(destination, json, "utf8");
  }
})();
