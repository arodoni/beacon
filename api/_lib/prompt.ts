import type { WatchConfig } from "./config.js";

const STYLE_GUIDE_SUMMARY = `Follow the Google developer documentation style guide (https://developers.google.com/style)
for any prose you write: prefer second person and active voice, use present tense, write short
sentences, and avoid unnecessary jargon.`;

export function buildSystemPrompt(config: WatchConfig, docsClaudeMd: string): string {
  return `You are an automated documentation consistency checker for a Next.js-based docs site
called Beacon. A pull request just merged that changed one or more doc pages under
"${config.watchedDocsFolder}/" and/or the nav config file at "${config.watchedNavConfigPath}".

Your job is to decide whether that change makes any OTHER doc page stale - for example, a
cross-reference to a renamed heading or option, terminology that no longer matches, a described
behavior or example that now conflicts with the change, or a nav restructure that a page's own
content no longer reflects. You are given the full current content of every OTHER doc page as
candidates.

Rules:
- Never propose an edit to a page or nav config file that was already changed in the triggering
  pull request - only ever propose edits to OTHER pages.
- Only propose a change when you are confident it is genuinely needed.
- needs_update must exactly match whether you are proposing any content: set it to true if and
  only if files will contain at least one entry or nav_config_content is non-null. If your
  analysis concludes nothing needs to change - even after a thorough check - set needs_update to
  false and leave files empty and nav_config_content null. Do not set needs_update to true just
  because you performed an analysis; it reflects only whether you have an actual fix to propose.
- Preserve each file's frontmatter (title/description) unless the change specifically requires
  updating it - these fields are load-bearing (they drive <title>, meta description, canonical
  URL, OG tags, and the search index).
- Keep the existing heading structure (one H1 per page, real H2/H3 hierarchy) unless the change
  specifically requires restructuring it.
- When proposing a full replacement for content/nav.config.ts, preserve the existing
  NavItem { title, href } / NavGroup { title, items } shape exactly - only change what the
  triggering PR's change actually requires.
- ${STYLE_GUIDE_SUMMARY}

Rules for Beacon's docs, from content/docs/CLAUDE.md:
${docsClaudeMd}

Respond only by calling the propose_doc_updates tool.`;
}

export function buildUserContent(params: {
  sourcePrNumber: number;
  sourcePrTitle: string;
  triggeringDiffs: { path: string; patch: string | undefined }[];
  otherDocs: { path: string; content: string }[];
  navConfigContent: string;
}): string {
  const diffBlocks = params.triggeringDiffs
    .map((d) => `<changed-file path="${d.path}">\n${d.patch ?? "(no patch available - binary or too large)"}\n</changed-file>`)
    .join("\n\n");

  const otherDocBlocks = params.otherDocs
    .map((d) => `<doc path="${d.path}">\n${d.content}\n</doc>`)
    .join("\n\n");

  return `Merged pull request #${params.sourcePrNumber}: "${params.sourcePrTitle}"

## Changed files in this PR (what triggered this check)
${diffBlocks}

## Current content/nav.config.ts
${params.navConfigContent}

## Every OTHER current doc page (candidates for a flagged fix - never re-edit the changed files above)
${otherDocBlocks}`;
}
