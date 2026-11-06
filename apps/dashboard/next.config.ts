import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  poweredByHeader: false,
  outputFileTracingRoot: path.resolve(appDirectory, "../.."),
  // The monorepo root lint script runs ESLint 10 for this app; Next 15's built-in lint bridge is legacy.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
