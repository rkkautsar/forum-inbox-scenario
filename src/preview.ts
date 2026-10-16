import { excerpt } from "./text.ts";

export function preview(text: string): string {
  return excerpt(text, 180);
}
