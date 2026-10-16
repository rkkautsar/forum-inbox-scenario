import express from "express";
import type { ForumFeature } from "../src/server.ts";

const router = express.Router();
router.patch("/comments/:commentId", (request, response) => {
  const db = request.app.locals.db;
  const comment = db.prepare("SELECT * FROM comments WHERE id=?").get(request.params.commentId) as any;
  if (!comment) {
    response.status(404).json({ error: "Comment not found" });
    return;
  }
  if (comment.authorId !== request.user) {
    response.status(403).json({ error: "Only the author can edit this comment" });
    return;
  }
  const body = String((request.body ?? {}).body ?? "").trim();
  if (!body || body.length > 2000) {
    response.status(400).json({ error: "Use a comment up to 2000 characters" });
    return;
  }
  db.prepare("UPDATE comments SET body=?,editedAt=? WHERE id=?").run(body, Date.now(), comment.id);
  response.json({ ...comment, body, editedAt: Date.now() });
});

export const feature: ForumFeature = { id: "comment-edit", label: "Edit your comments", router };
