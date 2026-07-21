import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { nav, type NavGroup } from "../../content/nav.config";

const DOCS_DIR = path.join(process.cwd(), "content", "docs");
const INTRODUCTION_SLUG = "introduction";

export type DocFrontmatter = {
  title: string;
  description: string;
};

export type Doc = {
  slug: string;
  href: string;
  frontmatter: DocFrontmatter;
  content: string;
};

function readDoc(slug: string): Doc {
  const filePath = path.join(DOCS_DIR, `${slug}.mdx`);
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  return {
    slug,
    href: slug === INTRODUCTION_SLUG ? "/" : `/${slug}`,
    frontmatter: {
      title: data.title ?? slug,
      description: data.description ?? "",
    },
    content,
  };
}

function allSlugs(): string[] {
  return fs
    .readdirSync(DOCS_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

/** Slugs served by the [...slug] catch-all route, i.e. every doc except the introduction (served at "/"). */
export function getAllDocSlugs(): string[] {
  return allSlugs().filter((slug) => slug !== INTRODUCTION_SLUG);
}

export function getDocBySlug(slug: string): Doc {
  return readDoc(slug);
}

export function getIntroductionDoc(): Doc {
  return readDoc(INTRODUCTION_SLUG);
}

export function getAllDocsMeta(): Doc[] {
  return allSlugs().map(readDoc);
}

const STATIC_ROUTES = new Set(["/", "/playground"]);

/**
 * Throws at build time if a nav entry points at a route that doesn't exist,
 * so a typo in nav.config.ts fails the build instead of 404ing in production
 * (there's no server to fall back on under `output: "export"`).
 */
export function validateNav(groups: NavGroup[] = nav): void {
  const knownHrefs = new Set([
    ...STATIC_ROUTES,
    ...getAllDocSlugs().map((slug) => `/${slug}`),
  ]);

  for (const group of groups) {
    for (const item of group.items) {
      if (!knownHrefs.has(item.href)) {
        throw new Error(
          `nav.config.ts: "${item.title}" points to "${item.href}", which doesn't match "/", "/playground", or any file in content/docs/.`
        );
      }
    }
  }
}

export type SearchEntry = {
  title: string;
  description: string;
  href: string;
  excerpt: string;
};

function stripToPlainText(mdx: string): string {
  return mdx
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_~-]/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildSearchEntries(): SearchEntry[] {
  const entries = getAllDocsMeta().map((doc) => ({
    title: doc.frontmatter.title,
    description: doc.frontmatter.description,
    href: doc.href,
    excerpt: stripToPlainText(doc.content).slice(0, 240),
  }));

  entries.push({
    title: "Playground",
    description: "Write Markdown and see it rendered live.",
    href: "/playground",
    excerpt: "Interactive Markdown editor with instant preview.",
  });

  return entries;
}
