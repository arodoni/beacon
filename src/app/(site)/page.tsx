import type { Metadata } from "next";
import { Mdx } from "../../components/docs/Mdx";
import { getIntroductionDoc } from "../../lib/content";

export function generateMetadata(): Metadata {
  const doc = getIntroductionDoc();
  return {
    title: doc.frontmatter.title,
    description: doc.frontmatter.description,
  };
}

export default async function Home() {
  const doc = getIntroductionDoc();
  return <Mdx source={doc.content} />;
}
