import type { FeatureContext } from "../feature-types.ts";

export function CommentAction({ api, refresh, comment, user }: FeatureContext & { comment: { id: number; authorId: string; body: string } }) {
  if (comment.authorId !== user) return null;
  return <button onClick={async () => {
    const body = window.prompt("Update your comment", comment.body);
    if (body === null) return;
    await api(`/api/comments/${comment.id}`, { method: "PATCH", body: JSON.stringify({ body }) });
    refresh();
  }}>Edit</button>;
}
