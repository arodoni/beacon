import type { MetadataRoute } from "next";
import { getAllDocSlugs } from "../lib/content";

export const dynamic = "force-static";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/editor", ...getAllDocSlugs().map((slug) => `/${slug}`)];
  return routes.map((route) => ({ url: `${siteUrl}${route}` }));
}
