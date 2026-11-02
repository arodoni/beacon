import type { Metadata } from "next";
import type { Doc } from "./content";
import { markdownMirrorHref } from "./markdown-mirror";
import { siteUrl } from "./site";

export function buildDocMetadata(doc: Doc): Metadata {
  const url = `${siteUrl}${doc.href}`;
  return {
    title: doc.frontmatter.title,
    description: doc.frontmatter.description,
    alternates: {
      canonical: url,
      types: { "text/markdown": `${siteUrl}${markdownMirrorHref(doc)}` },
    },
    openGraph: {
      title: doc.frontmatter.title,
      description: doc.frontmatter.description,
      url,
      type: "article",
    },
  };
}
