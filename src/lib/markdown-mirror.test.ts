import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { buildMarkdownMirrors, mdxToMarkdown } from "./markdown-mirror.ts";

/**
 * Guards against MDX components leaking into the Markdown mirrors,
 * /llms-full.txt, and the REST API's `markdown` field. Every component
 * registered in src/components/docs/Mdx.tsx needs a conversion in
 * mdxToMarkdown() and a sample below.
 */

/** Capitalized component names passed to compileMDX in Mdx.tsx. HTML overrides such as `img` are skipped. */
function registeredComponents(): string[] {
  const source = fs.readFileSync(path.join(import.meta.dirname, "../components/docs/Mdx.tsx"), "utf8");
  const block = source.match(/components:\s*{([^}]*)}/);
  assert.ok(block, "couldn't find the components object in Mdx.tsx");
  return block[1]
    .split(",")
    .map((entry) => entry.split(":")[0].trim())
    .filter((name) => /^[A-Z]/.test(name));
}

/**
 * Drops fenced and inline code, where component tags are allowed to appear
 * literally. Fences can be indented or quoted, as they are inside a converted
 * Step or Callout.
 */
function withoutCode(markdown: string): string {
  return markdown
    .replace(/^[ \t>]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t>]*\1[^\n]*$/gm, "")
    .replace(/(`+)[\s\S]*?\1/g, "");
}

function leakedTags(markdown: string, names: string[]): string[] {
  const prose = withoutCode(markdown);
  return names.filter((name) => new RegExp(`</?${name}\\b`).test(prose));
}

/**
 * One representative MDX snippet per registered component. Media samples use
 * full URLs, because a content/media/ path must exist on disk to resolve.
 */
const samples: Record<string, string> = {
  Callout: '<Callout type="warning">\nBack up your files first.\n</Callout>\n\n<Callout>One-line note.</Callout>',
  Steps: '<Steps>\n  <Step title="Install">\n    Run the installer.\n  </Step>\n</Steps>',
  Step: '<Steps>\n  <Step title="Configure">\n    Edit the config file.\n  </Step>\n</Steps>',
  Image: '<Image src="https://example.com/diagram.png" alt="Architecture diagram" caption="How it fits together" />',
  Video: '<Video src="https://example.com/demo.mp4" title="Demo" />',
};

test("every registered MDX component has a conversion sample", () => {
  const missing = registeredComponents().filter((name) => !(name in samples));
  assert.deepEqual(
    missing,
    [],
    `Add a conversion to mdxToMarkdown() in src/lib/markdown-mirror.ts and a sample here for: ${missing.join(", ")}`
  );
});

test("mdxToMarkdown converts every registered MDX component", () => {
  const names = registeredComponents();
  for (const [name, mdx] of Object.entries(samples)) {
    assert.deepEqual(leakedTags(mdxToMarkdown(mdx), names), [], `${name} sample leaked raw tags`);
  }
});

test("mdxToMarkdown leaves component tags inside code alone", () => {
  const mdx = "```mdx\n<Callout>Example</Callout>\n```";
  assert.equal(mdxToMarkdown(mdx), mdx + "\n");
});

test("no Markdown mirror contains raw component tags", () => {
  const names = registeredComponents();
  for (const [file, markdown] of buildMarkdownMirrors()) {
    assert.deepEqual(leakedTags(markdown, names), [], `${file} contains raw MDX component tags`);
  }
});
