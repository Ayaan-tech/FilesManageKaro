import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    // Empty turbopack config to silence the warning
    // The ui folder exclusion is no longer needed as we're integrating it
  },
};

export default nextConfig;
