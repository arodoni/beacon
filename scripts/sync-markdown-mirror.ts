// Writes a plain Markdown copy of every docs page to public/, such as
// public/quickstart.md, so Next.js serves it at /quickstart.md. Runs before
// `npm run dev` and `npm run build`. The files are generated, so they're
// gitignored and replaced on every run.
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildMarkdownMirrors } from "../src/lib/markdown-mirror";

const target = "public";

for (const file of readdirSync(target)) {
  if (file.endsWith(".md")) rmSync(path.join(target, file));
}
rmSync(path.join(target, "api-reference"), { recursive: true, force: true });
for (const [file, markdown] of buildMarkdownMirrors()) {
  const filePath = path.join(target, file);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, markdown);
}
