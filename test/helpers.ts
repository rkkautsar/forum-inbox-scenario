import test from "node:test";
import assert from "node:assert/strict";
import { createForum } from "../src/server.ts";

export async function session(
  fn: (request: (path: string, options?: any) => Promise<any>) => Promise<void>,
) {
  const app = await createForum(":memory:");
  await new Promise<void>((r) => app.listen(0, "127.0.0.1", r));

  try {
    const { port } = app.address() as any;
    await fn(async (path, options = {}) => {
      const response = await fetch("http://127.0.0.1:" + port + path, {
        ...options,
        headers: {
          "content-type": "application/json",
          "x-demo-user": "maya",
          ...options.headers,
        },
      });

      return { status: response.status, data: await response.json() };
    });
  } finally {
    await new Promise<void>((r, j) => app.close((e) => (e ? j(e) : r())));
  }
}
