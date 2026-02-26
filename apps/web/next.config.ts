import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,

  reactCompiler: true,

  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
};

export default nextConfig;
