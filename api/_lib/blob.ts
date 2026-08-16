import { put, head, list } from "@vercel/blob";
import type { StoredSuggestion } from "./types.js";

const SUGGESTIONS_PREFIX = "doc-suggestions/";

function suggestionPath(prNumber: number): string {
  return `${SUGGESTIONS_PREFIX}pr-${prNumber}.json`;
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

/** Every stored doc-update suggestion, most recently generated first. */
export async function listSuggestions(): Promise<StoredSuggestion[]> {
  const { blobs } = await list({ prefix: SUGGESTIONS_PREFIX });

  const suggestions = await Promise.all(
    blobs.map(async (blob) => {
      const response = await fetch(blob.url);
      return (await response.json()) as StoredSuggestion;
    }),
  );

  return suggestions.sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
}
