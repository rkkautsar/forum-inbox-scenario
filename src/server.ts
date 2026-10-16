import express, { type Request, type Response } from "express";
import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { excerpt } from "./text.ts";
import { preview } from "./preview.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

declare global {
  namespace Express {
    interface Request {
      user: string;
    }
  }
}

export type ForumRequest = Request;
export type ForumFeature = {
  id: string;
  label: string;
  priority?: number;
  setup?: (database: DatabaseSync) => void;
  router?: express.Router;
  filterPosts?: (posts: any[], request: ForumRequest) => any[];
  decoratePost?: (post: any, request: ForumRequest) => any;
};

export async function createForum(
  database = process.env.FORUM_DATABASE ?? join(root, "data/forum.sqlite"),
) {
  if (database !== ":memory:")
    mkdirSync(dirname(database), { recursive: true });

  const db = new DatabaseSync(database);
  db.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS posts(id INTEGER PRIMARY KEY,authorId TEXT NOT NULL REFERENCES users(id),title TEXT NOT NULL,body TEXT NOT NULL,createdAt INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS comments(id INTEGER PRIMARY KEY,postId INTEGER NOT NULL REFERENCES posts(id),authorId TEXT NOT NULL REFERENCES users(id),body TEXT NOT NULL,createdAt INTEGER NOT NULL,editedAt INTEGER);
    INSERT OR IGNORE INTO users VALUES('maya','Maya'),('sam','Sam'),('priya','Priya');`);

  if (!(db.prepare("SELECT COUNT(*) AS n FROM posts").get() as any).n) {
    const addPost = db.prepare(
      "INSERT INTO posts(authorId,title,body,createdAt) VALUES(?,?,?,?)",
    );
    addPost.run(
      "maya",
      "What are you working on this weekend?",
      "I finally got the old camera working. Share your projects, tiny victories, and things you are stuck on.",
      1000,
    );
    addPost.run(
      "priya",
      "Moving our community out of the group chat",
      "The chat moves too fast for useful answers to stick around. I would love a place where we can find old discussions again.",
      2000,
    );
    addPost.run(
      "sam",
      "Show us your desk setup",
      "Mine is a kitchen table and a monitor balanced on two books. Looking for practical ideas, not another shopping list.",
      3000,
    );
    db.prepare(
      "INSERT INTO comments(postId,authorId,body,createdAt) VALUES(?,?,?,?)",
    ).run(
      2,
      "maya",
      "Keeping the first release small will help. Posts and comments already work; the incoming contributions can cover the rest.",
      4000,
    );
  }

  const features: ForumFeature[] = [];
  const featureDirectory = join(root, "features");
  for (const file of readdirSync(featureDirectory)
    .filter((name) => name.endsWith(".ts"))
    .sort()) {
    const { feature } = await import(
      pathToFileURL(join(featureDirectory, file)).href
    );
    features.push(feature as ForumFeature);
  }
  features.sort((left, right) => (left.priority ?? 0) - (right.priority ?? 0));
  for (const feature of features) feature.setup?.(db);

  const app = express();
  app.locals.db = db;
  app.use(express.json({ limit: "10kb" }));
  app.use(express.static(join(root, "dist")));
  app.use("/api", (request: Request, response: Response, next) => {
    const user = String(request.header("x-demo-user") ?? "maya");
    if (!db.prepare("SELECT id FROM users WHERE id=?").get(user)) {
      response.status(401).json({ error: "Choose a demo user" });
      return;
    }
    request.user = user;
    next();
  });

  for (const feature of features) {
    if (feature.router) app.use("/api", feature.router);
  }

  app.get("/api/users", (_request, response) => {
    response.json(db.prepare("SELECT * FROM users").all());
  });
  app.get("/api/features", (_request, response) => {
    response.json(features.map(({ id, label }) => ({ id, label })));
  });
  app.get("/api/posts", (request, response) => {
    let posts: any[] = db
      .prepare(
        "SELECT posts.*,users.name AS author FROM posts JOIN users ON users.id=posts.authorId ORDER BY createdAt DESC,id DESC",
      )
      .all();
    const forumRequest = request as ForumRequest;
    for (const feature of features) {
      if (feature.filterPosts) posts = feature.filterPosts(posts, forumRequest);
    }

    const results = posts.map((post) => {
      let result = {
        ...post,
        preview: preview(post.body),
        comments: db
          .prepare(
            "SELECT comments.*,users.name AS author FROM comments JOIN users ON users.id=comments.authorId WHERE postId=? ORDER BY createdAt,id",
          )
          .all(post.id)
          .map((comment: any) => ({
            ...comment,
            summary: excerpt(comment.body, 80),
          })),
      };
      for (const feature of features) {
        if (feature.decoratePost)
          result = feature.decoratePost(result, forumRequest);
      }
      return result;
    });
    response.json(results);
  });
  app.post("/api/posts", (request, response) => {
    const input = request.body ?? {};
    const title = String(input.title ?? "").trim();
    const body = String(input.body ?? "").trim();
    if (!title || title.length > 160 || !body || body.length > 5000) {
      response.status(400).json({
        error:
          "Use a title up to 160 characters and a post up to 5000 characters.",
      });
      return;
    }
    const result = db
      .prepare(
        "INSERT INTO posts(authorId,title,body,createdAt) VALUES(?,?,?,?)",
      )
      .run(request.user, title, body, Date.now());
    response.status(201).json({ id: Number(result.lastInsertRowid) });
  });
  app.post("/api/posts/:postId/comments", (request, response) => {
    const { postId } = request.params;
    if (!db.prepare("SELECT id FROM posts WHERE id=?").get(postId)) {
      response.status(404).json({ error: "Post not found" });
      return;
    }
    const body = String((request.body ?? {}).body ?? "").trim();
    if (!body || body.length > 2000) {
      response
        .status(400)
        .json({ error: "Use a comment up to 2000 characters." });
      return;
    }
    const result = db
      .prepare(
        "INSERT INTO comments(postId,authorId,body,createdAt) VALUES(?,?,?,?)",
      )
      .run(postId, (request as ForumRequest).user, body, Date.now());
    response.status(201).json({ id: Number(result.lastInsertRowid) });
  });

  app.use(
    (error: Error, _request: Request, response: Response, _next: Function) => {
      response.status(400).json({ error: error.message });
    },
  );
  const server = createServer(app);
  server.on("close", () => db.close());
  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const app = await createForum();
  const port = Number(process.env.PORT ?? 3001);
  app.listen(port, "127.0.0.1", () => {
    console.log("Forum: http://localhost:" + port);
  });
}
