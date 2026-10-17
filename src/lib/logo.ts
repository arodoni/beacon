import fs from "node:fs";
import path from "node:path";

const CONTENT_DIR = path.join(process.cwd(), "content");

const MIME_TYPES: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

/**
 * Finds content/<baseName>.<ext> for a supported image type and returns it as
 * a data URI, or null if there's no such file. Inlining the image means it
 * needs no copy in public/ and works under any BASE_PATH. Throws at build time
 * if more than one matching file exists, so the choice is never ambiguous.
 */
function readLogo(baseName: string): string | null {
  const matches = Object.keys(MIME_TYPES)
    .map((ext) => `${baseName}${ext}`)
    .filter((fileName) => fs.existsSync(path.join(CONTENT_DIR, fileName)));

  if (matches.length === 0) return null;
  if (matches.length > 1) {
    throw new Error(`content/: found ${matches.join(", ")}. Keep only one ${baseName} file.`);
  }

  const fileName = matches[0];
  const mimeType = MIME_TYPES[path.extname(fileName)];
  const data = fs.readFileSync(path.join(CONTENT_DIR, fileName)).toString("base64");
  return `data:${mimeType};base64,${data}`;
}

/**
 * Product logo shown in the top bar in place of the Beacon logo. Add
 * content/logo.svg (or .png, .jpg, .jpeg, .webp) to set it, and optionally
 * content/logo-dark.* for a version to show in dark mode.
 */
export const logo = readLogo("logo");
export const logoDark = readLogo("logo-dark");
