import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pricing is not shown for now; keep old links working.
  async redirects() {
    return [{ source: "/pricing", destination: "/", permanent: false }];
  },
  images: {
    // Unsplash photos are served from Unsplash's CDN directly; everything else
    // still goes through Vercel's optimiser (see src/lib/image-loader.ts).
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
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
