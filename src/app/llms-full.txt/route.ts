import { getAllDocsMeta, getIntroductionDoc } from "../../lib/content";
import { siteUrl } from "../../lib/site";

export const dynamic = "force-static";

export async function GET() {
  const intro = getIntroductionDoc();
  const docs = getAllDocsMeta().filter((doc) => doc.slug !== intro.slug);
  const allDocs = [intro, ...docs];

  const sections = allDocs.map((doc) =>
    [`URL: ${siteUrl}${doc.href}`, "", doc.content.trim()].join("\n")
  );

  const lines = [
    `# ${intro.frontmatter.title}`,
    "",
    `> ${intro.frontmatter.description}`,
    "",
    "Full text of every page on this site, for AI/LLM ingestion. See /llms.txt for a page index instead.",
    "",
    sections.join("\n\n---\n\n"),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
