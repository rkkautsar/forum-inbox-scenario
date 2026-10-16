import test from "node:test";
import assert from "node:assert/strict";
import { session } from "./helpers.ts";

test("votes are idempotent per member and missing threads stay missing", () =>
  session(async (request) => {
    const once = await request("/api/posts/1/votes", { method: "POST" });

    const twice = await request("/api/posts/1/votes", { method: "POST" });

    assert.equal(once.data.score, 1);
    assert.equal(twice.data.score, 1);
    assert.equal(
      (await request("/api/posts/999/votes", { method: "POST" })).status,
      404,
    );
  }));
