export function excerpt(text: string, limit = 180): string {
  const chars = Array.from(text.replace(/\s+/g, " ").trim());

  return chars.length > limit
    ? chars.slice(0, limit).join("") + "…"
    : chars.join("");
}
