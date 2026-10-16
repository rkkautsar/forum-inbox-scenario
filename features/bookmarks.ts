import express from "express";
import type { ForumFeature } from "../src/server.ts";

const router = express.Router();
router.post("/posts/:postId/bookmark", (request, response) => {
  const db = request.app.locals.db;
  const { postId } = request.params;
  if (!db.prepare("SELECT id FROM posts WHERE id=?").get(postId)) {
    response.status(404).json({ error: "Post not found" });
    return;
  }
  db.prepare("INSERT OR IGNORE INTO bookmarks(postId,userId) VALUES(?,?)").run(postId, request.user);
  response.json({ saved: true });
});
router.delete("/posts/:postId/bookmark", (request, response) => {
  const db = request.app.locals.db;
  db.prepare("DELETE FROM bookmarks WHERE postId=? AND userId=?").run(request.params.postId, request.user);
  response.json({ saved: false });
});

export const feature: ForumFeature = {
  id: "bookmarks",
  label: "Save a thread for later",
  router,
  setup(db) {
    db.exec("CREATE TABLE IF NOT EXISTS bookmarks(postId INTEGER REFERENCES posts(id),userId TEXT REFERENCES users(id),PRIMARY KEY(postId,userId))");
  },
  priority: 5,
  filterPosts(posts, request) {
    if (request.query.saved !== "1") return posts;
    const db = request.app.locals.db;
    const saved = new Set(db.prepare("SELECT postId FROM bookmarks WHERE userId=?").all(request.user).map((row: any) => row.postId));
    return posts.filter((post) => saved.has(post.id));
  },
  decoratePost(post, request) {
    const db = request.app.locals.db;
    return { ...post, saved: Boolean(db.prepare("SELECT 1 FROM bookmarks WHERE postId=? AND userId=?").get(post.id, request.user)) };
  },
};
