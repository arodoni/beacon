import { nav, type NavGroup } from "../../content/nav.config";
import { getAllDocsMeta, type Doc } from "./content";
import { markdownMirrorHref, mdxToMarkdown } from "./markdown-mirror";
import { productName, siteUrl } from "./site";

/**
 * Response bodies for the read-only REST API under /api/v1/. The site is a
 * static export, so src/app/api/v1/ writes each body to a file at build time.
 */

const API_ROOT = "/api/v1";

/** File name of a doc's API response, used as the [slug] route param. */
export function docFileName(slug: string): string {
  return `${slug}.json`;
}

function absoluteUrl(href: string): string {
  return `${siteUrl}${href}`;
}

function summarizeDoc(doc: Doc) {
  return {
    slug: doc.slug,
    title: doc.frontmatter.title,
    description: doc.frontmatter.description,
    url: absoluteUrl(doc.href),
    markdownUrl: absoluteUrl(markdownMirrorHref(doc)),
    apiUrl: absoluteUrl(`${API_ROOT}/docs/${docFileName(doc.slug)}`),
  };
}

export function buildDocsResponse(docs: Doc[] = getAllDocsMeta()) {
  const sorted = [...docs].sort((a, b) => a.slug.localeCompare(b.slug));
  return { docs: sorted.map(summarizeDoc) };
}

export function buildDocResponse(doc: Doc) {
  return { ...summarizeDoc(doc), markdown: mdxToMarkdown(doc.content) };
}

export function buildNavResponse(groups: NavGroup[] = nav) {
  return {
    groups: groups.map((group) => ({
      title: group.title,
      href: group.href,
      url: absoluteUrl(group.href),
      items: group.items.map((item) => ({
        title: item.title,
        href: item.href,
        url: absoluteUrl(item.href),
      })),
    })),
  };
}

function jsonResponse(description: string, schema: string) {
  return {
    description,
    content: { "application/json": { schema: { $ref: `#/components/schemas/${schema}` } } },
  };
}

const stringProperty = { type: "string" };
const urlProperty = { type: "string", format: "uri" };
const docSummaryProperties = {
  slug: stringProperty,
  title: stringProperty,
  description: stringProperty,
  url: urlProperty,
  markdownUrl: urlProperty,
  apiUrl: urlProperty,
};
const navLinkProperties = { title: stringProperty, href: stringProperty, url: urlProperty };

export function buildOpenApiDocument() {
  return {
    openapi: "3.1.0",
    info: {
      title: `${productName} Documentation API`,
      version: "1.0.0",
      description: "Read-only access to documentation pages and navigation. Files are generated at build time.",
    },
    servers: [{ url: absoluteUrl(API_ROOT) }],
    paths: {
      "/docs.json": {
        get: {
          operationId: "listDocs",
          summary: "List all documentation pages",
          responses: { "200": jsonResponse("Metadata for every page", "DocList") },
        },
      },
      "/docs/{slug}.json": {
        get: {
          operationId: "getDoc",
          summary: "Get one documentation page",
          parameters: [{ name: "slug", in: "path", required: true, schema: stringProperty }],
          responses: {
            "200": jsonResponse("The page's metadata and Markdown body", "Doc"),
            "404": { description: "No page has this slug" },
          },
        },
      },
      "/nav.json": {
        get: {
          operationId: "getNav",
          summary: "Get the navigation tree",
          responses: { "200": jsonResponse("Navigation groups and their links", "Nav") },
        },
      },
    },
    components: {
      schemas: {
        DocSummary: {
          type: "object",
          required: Object.keys(docSummaryProperties),
          properties: docSummaryProperties,
        },
        DocList: {
          type: "object",
          required: ["docs"],
          properties: { docs: { type: "array", items: { $ref: "#/components/schemas/DocSummary" } } },
        },
        Doc: {
          type: "object",
          required: [...Object.keys(docSummaryProperties), "markdown"],
          properties: { ...docSummaryProperties, markdown: stringProperty },
        },
        NavLink: {
          type: "object",
          required: Object.keys(navLinkProperties),
          properties: navLinkProperties,
        },
        NavGroup: {
          type: "object",
          required: [...Object.keys(navLinkProperties), "items"],
          properties: {
            ...navLinkProperties,
            items: { type: "array", items: { $ref: "#/components/schemas/NavLink" } },
          },
        },
        Nav: {
          type: "object",
          required: ["groups"],
          properties: { groups: { type: "array", items: { $ref: "#/components/schemas/NavGroup" } } },
        },
      },
    },
  };
}
