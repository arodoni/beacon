import type { Metadata } from "next";
import { DocArticle } from "../../components/docs/DocArticle";
import { getIntroductionDoc } from "../../lib/content";
import { buildDocMetadata } from "../../lib/seo";

export function generateMetadata(): Metadata {
  return buildDocMetadata(getIntroductionDoc());
}

export default async function Home() {
  const doc = getIntroductionDoc();
  return <DocArticle content={doc.content} />;
}
