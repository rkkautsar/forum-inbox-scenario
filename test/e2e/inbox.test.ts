import test from "node:test";
import assert from "node:assert/strict";
import { withForum, type ForumRequest } from "./helpers.ts";

async function createPost(request: ForumRequest, user: string, title: string) {
  const result = await request(user, "/api/posts", {
    method: "POST",
    body: { title, body: "A thread created for the inbox scenario." },
  });
  assert.equal(result.status, 201);
  return result.data.id as number;
}

async function comment(
  request: ForumRequest,
  user: string,
  postId: number,
  body: string,
) {
  const result = await request(user, "/api/posts/" + postId + "/comments", {
    method: "POST",
    body: { body },
  });
  assert.equal(result.status, 201);
}

async function vote(request: ForumRequest, user: string, postId: number) {
  const result = await request(user, "/api/posts/" + postId + "/votes", {
    method: "POST",
  });
  assert.equal(result.status, 200);
}

test("the inbox includes only replies and votes on the viewer's threads", async () => {
  await withForum(async (request) => {
    const mayaPost = await createPost(request, "maya", "Maya's thread");
    const samPost = await createPost(request, "sam", "Sam's thread");

    await comment(request, "sam", mayaPost, "Sam replied to Maya.");
    await comment(request, "maya", mayaPost, "Maya replied to herself.");
    await comment(request, "maya", samPost, "Maya replied to Sam.");

    await vote(request, "sam", mayaPost);
    await vote(request, "maya", mayaPost);
    await vote(request, "maya", samPost);

    const result = await request("maya", "/api/inbox");
    assert.equal(result.status, 200);
    assert.ok(Array.isArray(result.data.items));
    const featureList = await request("maya", "/api/features");
    assert.ok(featureList.data.some((feature: any) => feature.id === "inbox"));

    const items = result.data.items;
    assert.equal(items.length, 2);
    assert.deepEqual(
      new Set(items.map((item: any) => item.type)),
      new Set(["reply", "vote"]),
    );
    assert.ok(
      items.every(
        (item: any) =>
          item.postId === mayaPost &&
          item.read === false &&
          item.id &&
          item.title &&
          item.actor,
      ),
    );
    assert.ok(items.some((item: any) => item.body === "Sam replied to Maya."));
    assert.ok(!items.some((item: any) => item.body?.includes("Maya replied")));
  });
});

test("the inbox returns only the newest 20 events in newest-first order", async () => {
  await withForum(async (request) => {
    const postId = await createPost(request, "maya", "A busy thread");
    for (let index = 1; index <= 21; index++)
      await comment(request, "sam", postId, "reply " + index);

    const result = await request("maya", "/api/inbox");
    assert.equal(result.status, 200);
    assert.equal(result.data.items.length, 20);
    assert.equal(result.data.items[0].body, "reply 21");
    assert.equal(result.data.items.at(-1).body, "reply 2");
  });
});

test("read state belongs to the viewer and does not expose another member's inbox", async () => {
  await withForum(async (request) => {
    const postId = await createPost(request, "maya", "Read state");
    await comment(request, "sam", postId, "A reply for Maya.");

    const initial = await request("maya", "/api/inbox");
    const item = initial.data.items.find(
      (entry: any) => entry.body === "A reply for Maya.",
    );
    assert.ok(item);
    assert.equal(item.read, false);

    const markRead = await request(
      "maya",
      "/api/inbox/" + encodeURIComponent(item.id) + "/read",
      { method: "POST" },
    );
    assert.equal(markRead.status, 200);

    const after = await request("maya", "/api/inbox");
    assert.equal(
      after.data.items.find((entry: any) => entry.id === item.id).read,
      true,
    );

    const otherMember = await request(
      "sam",
      "/api/inbox/" + encodeURIComponent(item.id) + "/read",
      { method: "POST" },
    );
    assert.ok(otherMember.status >= 400);
  });
});
