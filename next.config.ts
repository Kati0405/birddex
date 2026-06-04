import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      new URL('https://upload.wikimedia.org/**'),
      new URL('https://res.cloudinary.com/**'),
    ],
  },
};

export default nextConfig;
