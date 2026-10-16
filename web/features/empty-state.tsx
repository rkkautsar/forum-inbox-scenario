export function EmptyState({ query }: { query: string }) {
  const params = new URLSearchParams(query);
  const searching = Boolean(params.get("q"));
  const savedOnly = params.get("saved") === "1";
  return <div className="empty">
    <strong>{searching ? "No discussions match that search." : "Nothing here yet."}</strong>
    <p>{savedOnly ? "Save a thread using the button below it, then find it here." : searching ? "Try a shorter phrase, or clear your search." : "Someone has to start the conversation. Ask a question or share what you are working on."}</p>
  </div>;
}
