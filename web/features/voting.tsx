import type { FeatureContext } from "../feature-types.ts";

export function PostAction({ api, refresh, post }: FeatureContext) {
  if (!post) return null;
  return <button onClick={async () => {
    await api(`/api/posts/${post.id}/votes`, { method: "POST" });
    refresh();
  }}>↑ {post.score}</button>;
}
