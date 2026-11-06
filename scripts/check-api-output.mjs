// Fails the build if the static export is missing a REST API file, since a
// missing file would only show up as a 404 for API clients after deployment.
import fs from "node:fs";
import path from "node:path";

const API_DIR = path.join(process.cwd(), "out", "api", "v1");
const slugs = fs
  .readdirSync(path.join(process.cwd(), "content", "docs"))
  .filter((file) => file.endsWith(".mdx"))
  .map((file) => file.replace(/\.mdx$/, ""));

const expected = ["docs.json", "nav.json", "openapi.json", ...slugs.map((slug) => path.join("docs", `${slug}.json`))];

const problems = expected.flatMap((file) => {
  try {
    JSON.parse(fs.readFileSync(path.join(API_DIR, file), "utf8"));
    return [];
  } catch (err) {
    return [`${file}: ${err.message}`];
  }
});

if (problems.length > 0) {
  console.error(`REST API output check failed:\n${problems.join("\n")}`);
  process.exit(1);
}

console.log(`REST API output check passed: ${expected.length} files.`);
