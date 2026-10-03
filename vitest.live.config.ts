import { defineConfig } from "vitest/config";

// Opt-in checks against the real providers: `npm run test:live`. Not part of `npm test` or CI,
// because they depend on outside services and network access.
export default defineConfig({
  test: {
    include: ["tests/live/**/*.live.ts"],
    environment: "node",
    testTimeout: 30_000,
    fileParallelism: false,
  },
});
