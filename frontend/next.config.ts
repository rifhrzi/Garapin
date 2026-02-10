import type { NextConfig } from "next";

const isStaging = process.env.NEXT_PUBLIC_APP_ENV === "staging";

const nextConfig: NextConfig = {
  // Remove X-Powered-By header
  poweredByHeader: false,

  // Enable compression
  compress: true,

  // Image optimization with Supabase remote patterns
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // Enable experimental optimizations
  experimental: {
    optimizePackageImports: ["lucide-react", "radix-ui", "@supabase/supabase-js"],
  },

  // Block search engine indexing on staging
  async headers() {
    if (!isStaging) return [];
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
