import express from "express";
import type { ForumFeature } from "../src/server.ts";

const router = express.Router();
router.post("/posts/:postId/votes", (request, response) => {
  const db = request.app.locals.db;
  const { postId } = request.params;
  if (!db.prepare("SELECT id FROM posts WHERE id=?").get(postId)) {
    response.status(404).json({ error: "Post not found" });
    return;
  }
  db.prepare("INSERT OR IGNORE INTO votes(postId,userId) VALUES(?,?)").run(postId, request.user);
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM votes WHERE postId=?").get(postId) as { n: number };
  response.json({ score: n });
});

export const feature: ForumFeature = {
  id: "voting",
  label: "Vote on threads",
  router,
  setup(db) {
    db.exec("CREATE TABLE IF NOT EXISTS votes(postId INTEGER REFERENCES posts(id),userId TEXT REFERENCES users(id),PRIMARY KEY(postId,userId))");
  },
  decoratePost(post, request) {
    const db = request.app.locals.db;
    const { n } = db.prepare("SELECT COUNT(*) AS n FROM votes WHERE postId=?").get(post.id) as { n: number };
    return { ...post, score: n };
  },
};
