import { defineConfig } from "tsup";

// Backend-only package (Node.js >= 20). Browsers use @mgpl-diagnostics/client.
export default defineConfig({
  entry: { index: "src/server/index.ts", fastify: "src/server/fastify.ts" },
  format: ["esm"],
  dts: true,
  target: "node20",
  platform: "node",
  splitting: true,
  clean: true,
  // dependencies / peerDependencies stay external (tsup default)
  external: [/^node:/, "fastify"],
});
