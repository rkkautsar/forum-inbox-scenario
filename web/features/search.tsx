import { useState } from "react";
import type { FeatureContext } from "../feature-types.ts";

export function Toolbar({ query = "", setQuery }: FeatureContext) {
  const current = new URLSearchParams(query).get("q") ?? "";
  const [value, setValue] = useState(current);
  return <form data-search="" onSubmit={(event) => {
    event.preventDefault();
    const params = new URLSearchParams(query);
    if (value) params.set("q", value);
    else params.delete("q");
    params.delete("offset");
    setQuery?.(params.toString());
  }}>
    <input aria-label="Search discussions" placeholder="Search discussions" value={value} onChange={(event) => setValue(event.target.value)} />
    <button>Search</button>
  </form>;
}
