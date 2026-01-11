import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Enable standalone output for Docker deployment
  output: "standalone",

  // Optimize for production
  compress: true,

  // Security headers
  poweredByHeader: false,
  images: {
    qualities: [25, 50, 70, 75, 100],
  },
};

export default nextConfig;
