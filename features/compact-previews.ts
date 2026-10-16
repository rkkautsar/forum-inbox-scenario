import { preview } from "../src/preview.ts";
import type { ForumFeature } from "../src/server.ts";

export const feature: ForumFeature = {
  id: "compact-previews",
  label: "Compact post previews",
  decoratePost(post) {
    return { ...post, preview: preview(post.body) };
  },
};
