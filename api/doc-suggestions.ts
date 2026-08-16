import type { IncomingMessage, ServerResponse } from "node:http";
import { listSuggestions } from "./_lib/blob.js";

function respond(res: ServerResponse, statusCode: number, body: unknown): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== "GET") {
    respond(res, 405, { error: "method not allowed" });
    return;
  }

  try {
    const suggestions = await listSuggestions();
    respond(res, 200, { suggestions });
  } catch (err) {
    console.error("[doc-suggestions] failed to list suggestions", err);
    respond(res, 500, { error: "failed to list suggestions" });
  }
}
