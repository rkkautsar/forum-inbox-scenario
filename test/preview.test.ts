import test from "node:test";
import assert from "node:assert/strict";
import { preview } from "../src/preview.ts";

test("previews reuse the common text policy", () => {
  assert.equal(preview(" hello  there "), "hello there");
  assert.equal(Array.from(preview("x".repeat(200))).length, 181);
});
