import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Listing photos live in Supabase Storage.
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.supabase.in" },
      // Demo listings seeded by scripts/seed-demo.mjs use Unsplash photos.
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
