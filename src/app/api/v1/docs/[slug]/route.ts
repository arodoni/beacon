import { buildDocResponse, docFileName } from "../../../../../lib/api";
import { getAllDocsMeta, getDocBySlug } from "../../../../../lib/content";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllDocsMeta().map((doc) => ({ slug: docFileName(doc.slug) }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return Response.json(buildDocResponse(getDocBySlug(slug.replace(/\.json$/, ""))));
}
