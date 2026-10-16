import test from "node:test";
import assert from "node:assert/strict";
import { session } from "./helpers.ts";

test("a member can save, list and unsave a thread", () =>
  session(async (request) => {
    await request("/api/posts/1/bookmark", { method: "POST" });

    assert.equal((await request("/api/posts?saved=1")).data[0].id, 1);
    await request("/api/posts/1/bookmark", { method: "DELETE" });

    assert.equal((await request("/api/posts?saved=1")).data.length, 0);
  }));

test("saved lists are private to the selected member", () =>
  session(async (request) => {
    await request("/api/posts/1/bookmark", {
      method: "POST",
      headers: { "x-demo-user": "sam" },
    });

    assert.equal((await request("/api/posts?saved=1")).data.length, 0);
    assert.equal(
      (await request("/api/posts?saved=1", { headers: { "x-demo-user": "sam" } })).data[0].id,
      1,
    );
  }));
