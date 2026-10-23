import type { NextConfig } from "next";

// Cache Components is intentionally off: nearly every page here is
// per-user and per-request (sessions, live attendance), so classic dynamic
// rendering is simpler and has no real downside at this scale.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
