import type { FeatureContext } from "../feature-types.ts";

export function Toolbar({ query = "", setQuery }: FeatureContext) {
  const params = new URLSearchParams(query);
  const savedOnly = params.get("saved") === "1";
  return <button onClick={() => {
    if (savedOnly) params.delete("saved");
    else params.set("saved", "1");
    params.delete("offset");
    setQuery?.(params.toString());
  }}>{savedOnly ? "Show all threads" : "My saved threads"}</button>;
}

export function PostAction({ api, refresh, post }: FeatureContext) {
  if (!post) return null;
  return <button onClick={async () => {
    await api(`/api/posts/${post.id}/bookmark`, { method: post.saved ? "DELETE" : "POST" });
    refresh();
  }}>{post.saved ? "Saved ✓" : "Save thread"}</button>;
}
