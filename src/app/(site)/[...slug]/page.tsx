import type { Metadata } from "next";
import { Mdx } from "../../../components/docs/Mdx";
import { getAllDocSlugs, getDocBySlug } from "../../../lib/content";

export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllDocSlugs().map((slug) => ({ slug: [slug] }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDocBySlug(slug.join("/"));
  return {
    title: doc.frontmatter.title,
    description: doc.frontmatter.description,
  };
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const doc = getDocBySlug(slug.join("/"));
  return <Mdx source={doc.content} />;
}
