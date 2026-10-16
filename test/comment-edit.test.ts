import test from "node:test";
import assert from "node:assert/strict";
import { session } from "./helpers.ts";

test("the author can edit a comment without changing its position", () =>
  session(async (request) => {
    const before = (await request("/api/posts")).data.find((p: any) => p.id === 2)
      .comments[0];

    const response = await request("/api/comments/" + before.id, {
      method: "PATCH",
      body: JSON.stringify({ authorId: "maya", body: "A clearer answer." }),
    });

    assert.equal(response.status, 200);
    assert.equal(response.data.createdAt, before.createdAt);
    assert.equal(
      (await request("/api/comments/1", {
        method: "PATCH",
        headers: { "x-demo-user": "sam" },
        body: JSON.stringify({ authorId: "sam", body: "A forged edit" }),
      })).status,
      403,
    );
    assert.equal(
      (
        await request("/api/comments/" + before.id, {
          method: "PATCH",
          body: JSON.stringify({ authorId: "maya", body: "" }),
        })
      ).status,
      400,
    );
  }));
