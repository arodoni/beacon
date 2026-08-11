import { put, head } from "@vercel/blob";
import type { StoredSuggestion } from "./types.js";

function suggestionPath(prNumber: number): string {
  return `doc-suggestions/pr-${prNumber}.json`;
}

/**
 * Deterministic-path existence check, used to avoid regenerating (and re-billing
 * Anthropic for) a suggestion GitHub already redelivered a webhook event for.
 */
export async function suggestionAlreadyExists(prNumber: number): Promise<boolean> {
  try {
    await head(suggestionPath(prNumber));
    return true;
  } catch {
    return false;
  }
}

export async function writeSuggestion(prNumber: number, suggestion: StoredSuggestion): Promise<string> {
  const blob = await put(suggestionPath(prNumber), JSON.stringify(suggestion, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return blob.url;
}
