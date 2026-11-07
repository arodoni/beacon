import { buildNavResponse } from "../../../../lib/api";

export const dynamic = "force-static";

export async function GET() {
  return Response.json(buildNavResponse());
}
