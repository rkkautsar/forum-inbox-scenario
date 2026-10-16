import test from "node:test";
import assert from "node:assert/strict";
import { session } from "./helpers.ts";

test("forum starts with real threads and persists comment writes", () =>
  session(async (request) => {
    const before = await request("/api/posts?limit=50");

    assert.equal(before.data.length, 3);

    const post = await request("/api/posts", {
      method: "POST",
      body: JSON.stringify({
        title: "A useful thread",
        body: "A question for everyone.",
      }),
    });

    assert.equal(post.status, 201);
    await request("/api/posts/" + post.data.id + "/comments", {
      method: "POST",
      body: JSON.stringify({ body: "I can help with that." }),
    });

    const after = await request("/api/posts?limit=50");

    assert.equal(after.data[0].comments[0].body, "I can help with that.");
    assert.equal((await request("/api/posts", { method: "POST" })).status, 400);
  }));
