import type { IncomingMessage, ServerResponse } from "node:http";
import { getSuggestion, writeSuggestion } from "./_lib/blob.js";
import { isAuthorized } from "./_lib/dashboard-auth.js";
import type { SuggestionStatus } from "./_lib/types.js";

const VALID_STATUSES: SuggestionStatus[] = ["pending", "accepted", "dismissed"];

async function readRawBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function respond(res: ServerResponse, statusCode: number, body: unknown): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function isValidStatus(value: unknown): value is SuggestionStatus {
  return typeof value === "string" && VALID_STATUSES.includes(value as SuggestionStatus);
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== "PATCH") {
    respond(res, 405, { error: "method not allowed" });
    return;
  }

  const dashboardSecret = process.env.DASHBOARD_API_SECRET;
  if (!dashboardSecret) {
    console.error("DASHBOARD_API_SECRET is not configured");
    respond(res, 500, { error: "server misconfigured" });
    return;
  }

  const authHeader = req.headers["authorization"];
  const provided = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (!isAuthorized(provided, dashboardSecret)) {
    respond(res, 401, { error: "unauthorized" });
    return;
  }

  let body: { prNumber?: unknown; status?: unknown };
  try {
    body = JSON.parse((await readRawBody(req)).toString("utf-8"));
  } catch {
    respond(res, 400, { error: "invalid JSON body" });
    return;
  }

  const { prNumber, status } = body;
  if (typeof prNumber !== "number" || !isValidStatus(status)) {
    respond(res, 400, {
      error: `prNumber must be a number and status must be one of: ${VALID_STATUSES.join(", ")}`,
    });
    return;
  }

  const suggestion = await getSuggestion(prNumber);
  if (!suggestion) {
    respond(res, 404, { error: "suggestion not found" });
    return;
  }

  suggestion.status = status;
  await writeSuggestion(prNumber, suggestion);

  respond(res, 200, { suggestion });
}
