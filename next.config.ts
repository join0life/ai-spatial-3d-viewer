import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL(
        "https://8vxcsfhrykka1mgr.public.blob.vercel-storage.com/thumbnails/**",
      ),
    ],
  },
};

export default nextConfig;
