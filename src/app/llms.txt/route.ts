import { getAllDocsMeta, getIntroductionDoc } from "../../lib/content";
import { siteUrl } from "../../lib/site";

export const dynamic = "force-static";

export async function GET() {
  const intro = getIntroductionDoc();
  const docs = getAllDocsMeta().filter((doc) => doc.slug !== intro.slug);

  const lines = [
    `# ${intro.frontmatter.title}`,
    "",
    `> ${intro.frontmatter.description}`,
    "",
    "## Docs",
    "",
    ...docs.map(
      (doc) => `- [${doc.frontmatter.title}](${siteUrl}${doc.href}): ${doc.frontmatter.description}`
    ),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
