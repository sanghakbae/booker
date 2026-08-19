import type { NextConfig } from "next";

// Static export is a deploy-time concern: GitHub Pages serves files only.
// Turning it on in dev would reject any manual created since the last build,
// because `output: export` refuses params that generateStaticParams did not
// produce. In production those URLs are handled by the 404.html fallback.
const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  ...(isProduction ? { output: "export" as const } : {}),
  // Directory-style URLs (/s/x/y/index.html) so Pages resolves them without a server.
  trailingSlash: true,
  // No image optimizer exists on a static host.
  images: { unoptimized: true },
};

export default nextConfig;
