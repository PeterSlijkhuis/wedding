import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

test("every language file has exactly the English keys", () => {
  const dir = new URL("../public/i18n/", import.meta.url);
  const load = (f) => JSON.parse(readFileSync(new URL(f, dir), "utf8"));
  const english = Object.keys(load("en.json")).sort();
  for (const file of readdirSync(dir)) {
    assert.deepEqual(Object.keys(load(file)).sort(), english, `${file} keys differ from en.json`);
  }
});
