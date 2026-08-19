import Anthropic from "@anthropic-ai/sdk";
import type { ProposeDocUpdatesResult } from "./types.js";

const TOOL_NAME = "propose_doc_updates";
const MODEL = "claude-sonnet-5";

const EMPTY_RESULT: ProposeDocUpdatesResult = {
  needs_update: false,
  summary: "",
  files: [],
  nav_config_content: null,
};

function isProposeDocUpdatesResult(value: unknown): value is ProposeDocUpdatesResult {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.needs_update === "boolean" &&
    typeof v.summary === "string" &&
    Array.isArray(v.files) &&
    (v.nav_config_content === null || typeof v.nav_config_content === "string")
  );
}

export async function proposeDocUpdates(params: {
  apiKey: string;
  systemPrompt: string;
  userContent: string;
}): Promise<ProposeDocUpdatesResult> {
  const client = new Anthropic({ apiKey: params.apiKey });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: "disabled" },
    system: params.systemPrompt,
    messages: [{ role: "user", content: params.userContent }],
    tools: [
      {
        name: TOOL_NAME,
        description:
          "Report whether the documentation is stale given a merged change, and if so, propose exact new content for the OTHER doc files that need a fix.",
        strict: true,
        input_schema: {
          type: "object",
          properties: {
            needs_update: { type: "boolean" },
            summary: {
              type: "string",
              description:
                "Human-readable explanation, stored alongside the suggestion for a person to review. Format as one Markdown bullet (\"- \") per distinct finding or reasoning step, each on its own line - never a single dense paragraph.",
            },
            files: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  path: { type: "string", description: "Repo-relative path, e.g. content/docs/configure.mdx" },
                  content: { type: "string", description: "Full replacement content for this file." },
                },
                required: ["path", "content"],
                additionalProperties: false,
              },
            },
            nav_config_content: {
              type: ["string", "null"],
              description: "Full replacement content for content/nav.config.ts if it needs a fix; null otherwise.",
            },
          },
          required: ["needs_update", "summary", "files", "nav_config_content"],
          additionalProperties: false,
        },
      },
    ],
    tool_choice: { type: "tool", name: TOOL_NAME },
  });

  if (response.stop_reason === "refusal") {
    return { ...EMPTY_RESULT, summary: "Claude declined to process this request (refusal)." };
  }

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use" || !isProposeDocUpdatesResult(toolUse.input)) {
    throw new Error(`Expected a valid propose_doc_updates tool_use block, got stop_reason=${response.stop_reason}`);
  }

  return toolUse.input;
}
