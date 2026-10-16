import type { ForumFeature } from "../src/server.ts";

export const feature: ForumFeature = {
  id: "search",
  label: "Find old discussions",
  priority: 10,
  filterPosts(posts, request) {
    const query = String(request.query.q ?? "").trim().toLocaleLowerCase();
    if (!query) return posts;
    return posts.filter((post) => (post.title + " " + post.body).toLocaleLowerCase().includes(query));
  },
};
