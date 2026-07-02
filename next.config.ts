import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["pdfkit", "pdf-parse"],
};

export default nextConfig;
