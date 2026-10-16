import type { ForumFeature } from "../src/server.ts";

export const feature: ForumFeature = {
  id: "pagination",
  label: "Browse older threads",
  priority: 20,
  filterPosts(posts, request) {
    const offset = Number(request.query.offset ?? 0);
    const limit = Number(request.query.limit ?? 2);
    if (!Number.isInteger(offset) || !Number.isInteger(limit) || offset < 0 || limit < 1 || limit > 50) {
      throw new Error("Invalid pagination");
    }
    return posts.slice(offset, offset + limit);
  },
};
