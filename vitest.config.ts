import { defineConfig } from "vitest/config";

// A separate config keeps the Vinext/Cloudflare plugins in vite.config.ts out of unit tests.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    restoreMocks: true,
    unstubGlobals: true,
  },
});
