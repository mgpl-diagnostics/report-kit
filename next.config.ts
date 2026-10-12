import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Node-only PDF libraries: keep them as runtime dependencies instead of bundling.
  serverExternalPackages: ["@react-pdf/renderer", "@resvg/resvg-js"],
  // Don't write AGENTS.md into the project on every `next dev`.
  agentRules: false,
};

export default nextConfig;
