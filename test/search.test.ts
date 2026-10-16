import test from "node:test";
import assert from "node:assert/strict";
import { session } from "./helpers.ts";

test("search finds titles and post bodies without case sensitivity", () =>
  session(async (request) => {
    assert.equal((await request("/api/posts?q=CAMERA")).data.length, 1);
    assert.equal((await request("/api/posts?q=missingword")).data.length, 0);
    assert.equal((await request("/api/posts?q=%5B")).status, 200);
    assert.equal((await request("/api/posts?q=%5B")).data.length, 0);
  }));
