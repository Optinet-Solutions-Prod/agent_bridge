import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Listing photos live in Supabase Storage.
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }, { protocol: "https", hostname: "**.supabase.in" }],
  },
};

export default nextConfig;
