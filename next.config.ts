import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true, // Enables React strict mode
  swcMinify: true, // Enables SWC minification
  experimental: {
    appDir: true, // Ensure Next.js 13/14 App Router is enabled
  },
  eslint: {
    ignoreDuringBuilds: true, // Prevent ESLint from blocking deployment
  },
  compiler: {
    styledComponents: true, // Enable if using styled-components
  },
};

export default nextConfig;
