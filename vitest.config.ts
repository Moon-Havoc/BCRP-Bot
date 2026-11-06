import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/src/**/*.test.ts", "apps/**/src/**/*.test.ts"],
    exclude: ["**/.vercel/**", "**/node_modules/**"],
    environment: "node",
  },
});
