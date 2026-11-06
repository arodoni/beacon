import { getAllDocsMeta, getIntroductionDoc } from "../../lib/content";
import { markdownMirrorHref } from "../../lib/markdown-mirror";
import { getApiReferenceDocs } from "../../lib/openapi";
import { siteUrl } from "../../lib/site";

export const dynamic = "force-static";

export async function GET() {
  const intro = getIntroductionDoc();
  const docs = [...getAllDocsMeta().filter((doc) => doc.slug !== intro.slug), ...getApiReferenceDocs()];

  const lines = [
    `# ${intro.frontmatter.title}`,
    "",
    `> ${intro.frontmatter.description}`,
    "",
    `Full text of every page: ${siteUrl}/llms-full.txt`,
    "",
    "Each link points to the page's plain Markdown version. Remove the .md suffix for the HTML page.",
    "",
    "## Docs",
    "",
    ...docs.map(
      (doc) => `- [${doc.frontmatter.title}](${siteUrl}${markdownMirrorHref(doc)}): ${doc.frontmatter.description}`
    ),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
