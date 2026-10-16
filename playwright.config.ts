import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./test/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    headless: true,
  },
  webServer: {
    command: "npm run start",
    url: "http://127.0.0.1:4173/api/users",
    env: {
      PORT: "4173",
      FORUM_DATABASE: ":memory:",
    },
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
