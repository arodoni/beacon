import type { Metadata } from "next";
import { Mdx } from "../../components/docs/Mdx";
import { getIntroductionDoc } from "../../lib/content";
import { buildDocMetadata } from "../../lib/seo";

export function generateMetadata(): Metadata {
  return buildDocMetadata(getIntroductionDoc());
}

export default async function Home() {
  const doc = getIntroductionDoc();
  return <Mdx source={doc.content} />;
}
