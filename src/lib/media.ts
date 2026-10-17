import fs from "node:fs";
import path from "node:path";

/**
 * Images and videos that docs embed live here. scripts/sync-media.mjs copies
 * them to public/media/, so they're served at /media/.
 */
const MEDIA_DIR = path.join(process.cwd(), "content", "media");

const MEDIA_EXTENSIONS = new Set([
  ".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif",
  ".mp4", ".webm", ".mov",
]);

const basePath = process.env.BASE_PATH ?? "";

/**
 * Turns a docs media reference into a URL the browser can load. Full URLs
 * pass through unchanged. Anything else is a file in content/media/, such as
 * "diagram.png" or "media/diagram.png", and gets the site's BASE_PATH. Throws
 * at build time if the file doesn't exist, so a typo fails the build instead
 * of shipping a broken image.
 */
export function resolveMediaSrc(src: string): string {
  if (/^(https?:)?\/\//.test(src) || src.startsWith("data:")) return src;

  const relative = src.replace(/^\/?(media\/)?/, "");
  const file = path.join(MEDIA_DIR, relative);
  if (!MEDIA_EXTENSIONS.has(path.extname(file).toLowerCase())) {
    throw new Error(`Media file "${src}" isn't a supported image or video type.`);
  }
  if (!fs.existsSync(file)) {
    throw new Error(`Media file "${src}" not found. Add it to content/media/${relative}.`);
  }
  return `${basePath}/media/${relative}`;
}
