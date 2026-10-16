import { expect, test } from "@playwright/test";

test("members can privately catch up on replies and votes", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const inboxButton = page.getByRole("button", { name: "Activity inbox" });
  await expect(inboxButton).toBeVisible();
  await inboxButton.click();

  let inbox = page.getByRole("region", { name: "Activity inbox" });
  await expect(inbox).toContainText(/no activity|all caught up/i);
  await inboxButton.click();

  const createPost = async (user: string, title: string) => {
    const response = await request.post("/api/posts", {
      headers: { "x-demo-user": user },
      data: { title, body: "A thread for the inbox end-to-end scenario." },
    });
    expect(response.status()).toBe(201);
    return (await response.json()).id as number;
  };
  const addComment = async (user: string, postId: number, body: string) => {
    const response = await request.post("/api/posts/" + postId + "/comments", {
      headers: { "x-demo-user": user },
      data: { body },
    });
    expect(response.status()).toBe(201);
  };
  const addVote = async (user: string, postId: number) => {
    const response = await request.post("/api/posts/" + postId + "/votes", {
      headers: { "x-demo-user": user },
    });
    expect(response.status()).toBe(200);
  };

  const mayaPost = await createPost("maya", "Maya's thread");
  const samPost = await createPost("sam", "Sam's thread");
  await addComment("sam", mayaPost, "Sam replied to Maya.");
  await addComment("maya", mayaPost, "Maya replied to herself.");
  await addComment("maya", samPost, "Maya replied on Sam's thread.");
  await addVote("sam", mayaPost);
  await addVote("maya", mayaPost);
  await addVote("maya", samPost);

  const response = await request.get("/api/inbox", {
    headers: { "x-demo-user": "maya" },
  });
  expect(response.status()).toBe(200);
  const items = (await response.json()).items;
  expect(Array.isArray(items)).toBe(true);

  const replyEvent = items.find(
    (item: any) => item.type === "reply" && item.body === "Sam replied to Maya.",
  );
  const voteEvent = items.find(
    (item: any) => item.type === "vote" && item.actor === "Sam",
  );
  expect(replyEvent).toMatchObject({
    postId: mayaPost,
    title: "Maya's thread",
    actor: "Sam",
    read: false,
  });
  expect(voteEvent).toMatchObject({
    postId: mayaPost,
    title: "Maya's thread",
    read: false,
  });
  expect(
    items.some(
      (item: any) =>
        item.postId === samPost ||
        item.body === "Maya replied to herself." ||
        item.actor === "Maya",
    ),
  ).toBe(false);

  await inboxButton.click();
  inbox = page.getByRole("region", { name: "Activity inbox" });
  await expect(inbox.getByRole("link")).toHaveCount(2);
  const replyLink = inbox
    .getByRole("link")
    .filter({ hasText: "Sam replied to Maya." });
  const voteLink = inbox.getByRole("link").filter({ hasText: "Sam voted" });
  await expect(voteLink).toContainText("Maya's thread");
  await expect(replyLink).toContainText("Unread");
  await expect(replyLink).toHaveAttribute("href", "#post-" + mayaPost);
  await replyLink.click();
  await expect(page).toHaveURL(new RegExp("#post-" + mayaPost + "$"));
  await expect(page.locator("#post-" + mayaPost)).toBeVisible();

  const afterOpen = await request.get("/api/inbox", {
    headers: { "x-demo-user": "maya" },
  });
  const updated = (await afterOpen.json()).items.find(
    (item: any) => item.id === replyEvent.id,
  );
  expect(updated.read).toBe(true);

  const samInbox = await request.get("/api/inbox", {
    headers: { "x-demo-user": "sam" },
  });
  const samItems = (await samInbox.json()).items;
  expect(samItems.some((item: any) => item.postId === samPost)).toBe(true);
  expect(samItems.some((item: any) => item.id === replyEvent.id)).toBe(false);
  const crossUserRead = await request.post(
    "/api/inbox/" + encodeURIComponent(replyEvent.id) + "/read",
    { headers: { "x-demo-user": "sam" } },
  );
  expect(crossUserRead.status()).toBeGreaterThanOrEqual(400);

  for (let index = 1; index <= 21; index++)
    await addComment("sam", mayaPost, "new reply " + index);
  const newest = await request.get("/api/inbox", {
    headers: { "x-demo-user": "maya" },
  });
  const recentItems = (await newest.json()).items;
  expect(recentItems).toHaveLength(20);
  expect(recentItems[0].body).toBe("new reply 21");
  expect(recentItems.at(-1).body).toBe("new reply 2");
});
