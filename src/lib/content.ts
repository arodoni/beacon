import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { nav, type NavGroup } from "../../content/nav.config";
import { productName, projectName } from "./site";

const DOCS_DIR = path.join(process.cwd(), "content", "docs");
const INTRODUCTION_SLUG = "introduction";

const CUSTOM_VARIABLES_FILE = path.join(process.cwd(), "content", "variables.json");

/**
 * Reads extra docs variables from content/variables.json, a flat object of
 * string values. The file is optional. Throws at build time on a malformed
 * entry or one that would shadow a built-in variable.
 */
function readCustomVariables(builtIn: Record<string, string>): Record<string, string> {
  if (!fs.existsSync(CUSTOM_VARIABLES_FILE)) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(CUSTOM_VARIABLES_FILE, "utf8"));
  } catch (error) {
    throw new Error(`content/variables.json: invalid JSON. ${(error as Error).message}`);
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("content/variables.json: expected an object of variable names to string values.");
  }

  for (const [name, value] of Object.entries(parsed)) {
    if (!/^\w+$/.test(name)) {
      throw new Error(`content/variables.json: invalid variable name "${name}". Use only letters, digits, and underscores.`);
    }
    if (Object.hasOwn(builtIn, name)) {
      throw new Error(`content/variables.json: "${name}" is a built-in variable and can't be redefined.`);
    }
    if (typeof value !== "string") {
      throw new Error(`content/variables.json: value of "${name}" must be a string.`);
    }
  }
  return parsed as Record<string, string>;
}

const BUILT_IN_VARIABLES: Record<string, string> = { productName, projectName };

/** Replacement variables available in docs as {{name}}, in frontmatter and body. */
const DOC_VARIABLES: Record<string, string> = {
  ...BUILT_IN_VARIABLES,
  ...readCustomVariables(BUILT_IN_VARIABLES),
};

/**
 * Throws at build time on an unknown variable, so a typo fails the build
 * instead of silently rendering nothing. A leading backslash escapes a
 * variable: \{{name}} renders as the literal text {{name}}.
 */
function applyDocVariables(raw: string, fileName: string): string {
  return raw.replace(/(\\?)\{\{(\w+)\}\}/g, (_match, escape: string, name: string) => {
    if (escape) return `{{${name}}}`;
    if (!Object.hasOwn(DOC_VARIABLES, name)) {
      const known = Object.keys(DOC_VARIABLES).map((key) => `{{${key}}}`).join(", ");
      throw new Error(`${fileName}: unknown variable "{{${name}}}". Known variables: ${known}.`);
    }
    return DOC_VARIABLES[name];
  });
}

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
  const raw = applyDocVariables(fs.readFileSync(filePath, "utf8"), `content/docs/${slug}.mdx`);
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

const STATIC_ROUTES = new Set(["/", "/dashboard", "/dashboard/editor"]);

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

  const staticRouteList = [...STATIC_ROUTES].map((route) => `"${route}"`).join(", ");

  for (const group of groups) {
    if (!knownHrefs.has(group.href)) {
      throw new Error(
        `nav.config.ts: "${group.title}" points to "${group.href}", which doesn't match ${staticRouteList}, or any file in content/docs/.`
      );
    }
    for (const item of group.items) {
      if (!knownHrefs.has(item.href)) {
        throw new Error(
          `nav.config.ts: "${item.title}" points to "${item.href}", which doesn't match ${staticRouteList}, or any file in content/docs/.`
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
    title: "Editor",
    description: "Write Markdown and see it rendered live.",
    href: "/dashboard/editor",
    excerpt: "Interactive Markdown editor with instant preview.",
  });

  return entries;
}
