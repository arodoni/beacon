// Copies content/media/ to public/media/ so Next.js serves docs images and
// videos as static files. Runs before `npm run dev` and `npm run build`.
// public/media/ is generated, so it's gitignored and replaced on every run.
import { cpSync, existsSync, rmSync } from "node:fs";

const source = "content/media";
const target = "public/media";

rmSync(target, { recursive: true, force: true });
if (existsSync(source)) cpSync(source, target, { recursive: true });
