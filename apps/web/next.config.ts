import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  transpilePackages: ["@pilot/ui", "@pilot/db"],

  reactCompiler: true,

  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
};

export default nextConfig;
