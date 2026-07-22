import type { MetadataRoute } from "next";
import { getAllDocSlugs } from "../lib/content";
import { siteUrl } from "../lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/editor", ...getAllDocSlugs().map((slug) => `/${slug}`)];
  return routes.map((route) => ({ url: `${siteUrl}${route}` }));
}
