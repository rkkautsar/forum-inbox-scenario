import type { FeatureContext } from "../feature-types.ts";

export function Pagination({ posts, query = "", setQuery }: FeatureContext & { posts: unknown[] }) {
  const params = new URLSearchParams(query);
  const offset = Number(params.get("offset") ?? 0);
  const size = 2;
  return <div id="pagination">
    <button disabled={offset === 0} onClick={() => {
      params.set("offset", String(Math.max(0, offset - size)));
      setQuery?.(params.toString());
    }}>← Newer</button>
    <button disabled={posts.length < size} onClick={() => {
      params.set("offset", String(offset + size));
      setQuery?.(params.toString());
    }}>Older →</button>
  </div>;
}
