import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts", "pdf/index": "src/pdf/index.ts", server: "src/server.ts" },
  format: ["esm"],
  dts: true,
  target: "es2022",
  platform: "neutral",
  splitting: true,
  clean: true,
  sourcemap: false,
  // dependencies / peerDependencies stay external (tsup default); node builtins too
  external: [/^node:/],
});
