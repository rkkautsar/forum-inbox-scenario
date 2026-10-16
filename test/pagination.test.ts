import test from "node:test";
import assert from "node:assert/strict";
import { session } from "./helpers.ts";

test("feed returns a page of threads and rejects negative offsets", () =>
  session(async (request) => {
    assert.equal((await request("/api/posts?offset=0&limit=2")).data.length, 2);
    assert.equal((await request("/api/posts?offset=2&limit=2")).data.length, 1);
    assert.equal((await request("/api/posts?offset=-1")).status, 400);
    assert.equal((await request("/api/posts?offset=NaN")).status, 400);
    assert.equal((await request("/api/posts?limit=1.5")).status, 400);
  }));
