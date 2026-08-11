import type { IncomingMessage, ServerResponse } from "node:http";
import { loadConfig, isWatchedPath } from "./_lib/config.js";
import { verifySignature } from "./_lib/verify-signature.js";
import { createGithubClient, getChangedFiles, getFileContent, listMdxFiles } from "./_lib/github.js";
import { buildSystemPrompt, buildUserContent } from "./_lib/prompt.js";
import { proposeDocUpdates } from "./_lib/claude.js";
import { suggestionAlreadyExists, writeSuggestion } from "./_lib/blob.js";
import type { PullRequestWebhookPayload, StoredSuggestion } from "./_lib/types.js";

async function readRawBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function respond(res: ServerResponse, statusCode: number, body: Record<string, unknown>): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const rawBody = await readRawBody(req);

  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("GITHUB_WEBHOOK_SECRET is not configured");
    respond(res, 500, { error: "server misconfigured" });
    return;
  }

  const signature = req.headers["x-hub-signature-256"];
  const signatureHeader = Array.isArray(signature) ? signature[0] : signature;
  if (!verifySignature(rawBody, signatureHeader, webhookSecret)) {
    respond(res, 401, { error: "invalid signature" });
    return;
  }

  const eventHeader = req.headers["x-github-event"];
  const event = Array.isArray(eventHeader) ? eventHeader[0] : eventHeader;

  if (event === "ping") {
    respond(res, 200, { ok: true, message: "pong" });
    return;
  }

  if (event !== "pull_request") {
    respond(res, 200, { ok: true, skipped: "not a pull_request event" });
    return;
  }

  let payload: PullRequestWebhookPayload;
  try {
    payload = JSON.parse(rawBody.toString("utf-8"));
  } catch {
    respond(res, 400, { error: "invalid JSON body" });
    return;
  }

  const config = loadConfig();

  if (payload.action !== "closed" || !payload.pull_request.merged || payload.pull_request.base.ref !== "main") {
    respond(res, 200, { ok: true, skipped: "not a merge to main" });
    return;
  }

  if (
    payload.repository.owner.login !== config.githubRepoOwner ||
    payload.repository.name !== config.githubRepoName
  ) {
    respond(res, 200, { ok: true, skipped: "repository does not match configured watch target" });
    return;
  }

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const githubReadToken = process.env.GITHUB_READ_TOKEN;
  if (!anthropicApiKey || !githubReadToken) {
    console.error("ANTHROPIC_API_KEY or GITHUB_READ_TOKEN is not configured");
    respond(res, 500, { error: "server misconfigured" });
    return;
  }

  const octokit = createGithubClient(githubReadToken);
  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const prNumber = payload.pull_request.number;
  const baseSha = payload.pull_request.base.sha;
  const mergeSha = payload.pull_request.merge_commit_sha;

  const changedFiles = await getChangedFiles(octokit, owner, repo, baseSha, mergeSha);
  const triggeringFiles = changedFiles.filter((file) => isWatchedPath(file.path, config));

  if (triggeringFiles.length === 0) {
    respond(res, 200, { ok: true, skipped: "no watched paths changed" });
    return;
  }

  if (await suggestionAlreadyExists(prNumber)) {
    respond(res, 200, { ok: true, skipped: "suggestion already generated for this PR" });
    return;
  }

  const triggeringPaths = new Set(triggeringFiles.map((f) => f.path));

  const [allDocPaths, navConfigContent, docsClaudeMd] = await Promise.all([
    listMdxFiles(octokit, owner, repo, config.watchedDocsFolder, mergeSha),
    getFileContent(octokit, owner, repo, config.watchedNavConfigPath, mergeSha),
    getFileContent(octokit, owner, repo, `${config.watchedDocsFolder}/CLAUDE.md`, mergeSha),
  ]);

  const otherDocPaths = allDocPaths.filter((path) => !triggeringPaths.has(path));
  const otherDocs = (
    await Promise.all(
      otherDocPaths.map(async (path) => {
        const content = await getFileContent(octokit, owner, repo, path, mergeSha);
        return content !== null ? { path, content } : null;
      }),
    )
  ).filter((doc): doc is { path: string; content: string } => doc !== null);

  const systemPrompt = buildSystemPrompt(config, docsClaudeMd ?? "(no CLAUDE.md found)");
  const userContent = buildUserContent({
    sourcePrNumber: prNumber,
    sourcePrTitle: payload.pull_request.title,
    triggeringDiffs: triggeringFiles.map((f) => ({ path: f.path, patch: f.patch })),
    otherDocs,
    navConfigContent: navConfigContent ?? "(content/nav.config.ts not found)",
  });

  const result = await proposeDocUpdates({ apiKey: anthropicApiKey, systemPrompt, userContent });

  if (!result.needs_update) {
    console.log(`[doc-update] PR #${prNumber}: no update needed. ${result.summary}`);
    respond(res, 200, { ok: true, needsUpdate: false, summary: result.summary });
    return;
  }

  const acceptedFiles = result.files.filter(
    (file) =>
      file.path.startsWith(`${config.watchedDocsFolder}/`) &&
      file.path.endsWith(".mdx") &&
      !triggeringPaths.has(file.path),
  );
  const acceptedNavConfig =
    result.nav_config_content !== null && !triggeringPaths.has(config.watchedNavConfigPath)
      ? result.nav_config_content
      : null;

  const suggestion: StoredSuggestion = {
    sourcePrNumber: prNumber,
    sourcePrUrl: payload.pull_request.html_url,
    sourcePrTitle: payload.pull_request.title,
    summary: result.summary,
    files: acceptedFiles,
    navConfigContent: acceptedNavConfig,
    generatedAt: new Date().toISOString(),
  };

  const blobUrl = await writeSuggestion(prNumber, suggestion);

  console.log(`[doc-update] PR #${prNumber}: suggestion written to ${blobUrl}`);
  console.log(`[doc-update] Summary: ${result.summary}`);

  respond(res, 200, { ok: true, needsUpdate: true, blobUrl, summary: result.summary });
}
