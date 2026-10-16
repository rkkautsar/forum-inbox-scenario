import { createForum } from "../../src/server.ts";

type RequestOptions = {
  method?: string;
  body?: unknown;
};

export type ForumRequest = (
  user: string,
  path: string,
  options?: RequestOptions,
) => Promise<{ status: number; data: any }>;

export async function withForum(
  run: (request: ForumRequest) => Promise<void>,
) {
  const server = await createForum(":memory:");
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

  try {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("No server port");
    const base = "http://127.0.0.1:" + address.port;
    const request: ForumRequest = async (user, path, options = {}) => {
      const response = await fetch(base + path, {
        method: options.method ?? "GET",
        headers: {
          "content-type": "application/json",
          "x-demo-user": user,
        },
        body:
          options.body === undefined ? undefined : JSON.stringify(options.body),
      });
      return { status: response.status, data: await response.json() };
    };

    await run(request);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}
