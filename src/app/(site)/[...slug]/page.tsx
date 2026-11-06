import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApiOperationPage } from "../../../components/docs/ApiOperation";
import { DocArticle } from "../../../components/docs/DocArticle";
import { getAllDocSlugs, getDocBySlug } from "../../../lib/content";
import { API_REFERENCE_ROOT, getApiOperation, getApiOperations, operationToDoc } from "../../../lib/openapi";
import { buildDocMetadata } from "../../../lib/seo";

export const dynamicParams = false;

/** Finds the generated API reference page for a URL such as /api-reference/get-user. */
function findOperation(slug: string[]) {
  return slug.length === 2 && `/${slug[0]}` === API_REFERENCE_ROOT ? getApiOperation(slug[1]) : undefined;
}

/**
 * Finds the doc for a URL, or shows the not-found page. The dev server can
 * still route a page removed while it's running, so a slug may have no file.
 */
function findDoc(slug: string[]) {
  const docSlug = slug.join("/");
  if (!getAllDocSlugs().includes(docSlug)) notFound();
  return getDocBySlug(docSlug);
}

// Generated pages share this route rather than having their own, because a
// static export fails on a dynamic route with no params, as on a site with no spec.
export async function generateStaticParams() {
  return [
    ...getAllDocSlugs().map((slug) => ({ slug: [slug] })),
    ...getApiOperations().map((operation) => ({ slug: operation.href.slice(1).split("/") })),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const operation = findOperation(slug);
  return buildDocMetadata(operation ? operationToDoc(operation) : findDoc(slug));
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const operation = findOperation(slug);
  if (operation) return <ApiOperationPage operation={operation} />;

  return <DocArticle content={findDoc(slug).content} />;
}
