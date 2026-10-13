const basePath = process.env.BASE_PATH || "";

const nextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath,
  // Inline these at build time so client components can read them without
  // the NEXT_PUBLIC_ prefix.
  env: {
    BASE_PATH: basePath,
    PRODUCT_NAME: process.env.PRODUCT_NAME || "",
    SITE_URL: process.env.SITE_URL || "",
  },
};

export default nextConfig;
