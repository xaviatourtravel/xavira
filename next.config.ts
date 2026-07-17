import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["mammoth", "unpdf", "@react-pdf/renderer"],
  // PDF/image uploads go through Server Actions with FormData; default limit is 1MB.
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
