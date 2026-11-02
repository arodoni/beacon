import { getAllDocsMeta, type Doc } from "./content";
import { resolveMediaSrc } from "./media";
import { siteUrl } from "./site";

/**
 * Plain Markdown versions of docs pages, served next to each page as
 * /<slug>.md (and /index.md for the introduction) for AI tools and
 * readers that want the source text without the site's HTML.
 */

/** URL of a doc's Markdown mirror, relative to the site root. */
export function markdownMirrorHref(doc: Doc): string {
  return doc.href === "/" ? "/index.md" : `${doc.href}.md`;
}

const siteOrigin = new URL(siteUrl).origin;

function absoluteMediaUrl(src: string): string {
  const resolved = resolveMediaSrc(src);
  return resolved.startsWith("/") ? `${siteOrigin}${resolved}` : resolved;
}

function attr(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`));
  return match ? (match[1] ?? match[2]) : undefined;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Makes site links and content/media/ images absolute, so they still work
 * when the Markdown is read away from the site. Inline code is left as is.
 */
function rewriteLinks(line: string): string {
  return line
    .split(/(`+[^`]*`+)/)
    .map((part, i) =>
      i % 2 === 1
        ? part
        : part
            .replace(/!\[([^\]]*)\]\((?!https?:|\/\/|data:)([^)\s]+)\)/g, (_m, alt: string, src: string) => `![${alt}](${absoluteMediaUrl(src)})`)
            .replace(/\]\((\/[^)\s]*)\)/g, (_m, href: string) => `](${siteUrl}${href})`)
    )
    .join("");
}

type Frame = {
  kind: "steps" | "step" | "callout";
  /** Source indentation stripped from lines inside this frame. */
  from: number;
  /** Text that replaces it in the output. */
  prefix: string;
  /** Next step number, for a "steps" frame. */
  count: number;
};

/**
 * Converts a doc's MDX body to plain Markdown. Rewrites the components
 * registered in src/components/docs/Mdx.tsx (Callout, Steps, Step, Image,
 * Video) as their Markdown equivalents and makes site links absolute.
 * Components only convert when their tag is on a line of its own, which is
 * how the docs write them, and code blocks pass through untouched.
 */
export function mdxToMarkdown(mdx: string): string {
  const root: Frame = { kind: "steps", from: 0, prefix: "", count: 1 };
  const stack: Frame[] = [root];
  const out: string[] = [];
  let fence: string | null = null;

  const top = () => stack[stack.length - 1];

  /** Re-indents a source line for the current frame. */
  const place = (line: string, frame = top()) => {
    if (line.trim() === "") return frame.prefix.trimEnd();
    const indent = line.length - line.trimStart().length;
    return frame.prefix + line.slice(Math.min(indent, frame.from));
  };

  /** Opens a frame whose tag sits at `indent` in the source. */
  const open = (kind: Frame["kind"], indent: number, marker: string, extra = "") => {
    const tagPrefix = place(" ".repeat(indent) + "x").slice(0, -1);
    out.push(tagPrefix + marker);
    stack.push({ kind, from: indent + 2, prefix: tagPrefix + extra, count: 1 });
  };

  const close = (kind: Frame["kind"]) => {
    if (top().kind === kind && stack.length > 1) stack.pop();
  };

  for (const line of mdx.split("\n")) {
    const trimmed = line.trim();
    const indent = line.length - line.trimStart().length;

    const fenceMatch = trimmed.match(/^(`{3,}|~{3,})/);
    if (fence) {
      out.push(place(line));
      if (fenceMatch && trimmed.startsWith(fence)) fence = null;
      continue;
    }
    if (fenceMatch) {
      fence = fenceMatch[1];
      out.push(place(line));
      continue;
    }

    if (/^<Steps>$/.test(trimmed)) {
      // Steps adds no output of its own; its Step children align with it.
      stack.push({ kind: "steps", from: indent + 2, prefix: place(" ".repeat(indent) + "x").slice(0, -1), count: 1 });
      continue;
    }
    if (trimmed === "</Steps>") {
      close("steps");
      continue;
    }
    if (/^<Step\b[^>]*>$/.test(trimmed)) {
      const parent = top();
      const marker = `${parent.kind === "steps" ? parent.count++ : 1}. `;
      const title = attr(trimmed, "title");
      open("step", indent, `${marker}${title ? `**${title}**` : ""}`, " ".repeat(marker.length));
      out.push(top().prefix.trimEnd());
      continue;
    }
    if (trimmed === "</Step>") {
      close("step");
      out.push("");
      continue;
    }

    const oneLineCallout = trimmed.match(/^<Callout\b([^>]*)>(.*)<\/Callout>$/);
    if (oneLineCallout) {
      const label = capitalize(attr(oneLineCallout[1], "type") ?? "note");
      out.push(place(`${" ".repeat(indent)}> **${label}:** ${oneLineCallout[2].trim()}`));
      continue;
    }
    if (/^<Callout\b[^>]*>$/.test(trimmed)) {
      const label = capitalize(attr(trimmed, "type") ?? "note");
      open("callout", indent, `> **${label}**`, "> ");
      out.push(top().prefix.trimEnd());
      continue;
    }
    if (trimmed === "</Callout>") {
      close("callout");
      continue;
    }

    if (/^<(Image|Video)\b[^>]*\/>$/.test(trimmed)) {
      const src = attr(trimmed, "src");
      if (src) {
        const url = absoluteMediaUrl(src);
        const text = trimmed.startsWith("<Image")
          ? `![${attr(trimmed, "alt") ?? ""}](${url})`
          : `[Video: ${attr(trimmed, "title") ?? src}](${url})`;
        const caption = attr(trimmed, "caption");
        out.push(place(" ".repeat(indent) + text));
        if (caption) out.push(place(" ".repeat(indent) + `*${caption}*`));
      }
      continue;
    }

    out.push(rewriteLinks(place(line)));
  }

  // Drop the blank lines the removed tags leave behind.
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

/** A doc's full Markdown mirror: frontmatter with its canonical URL, then the converted body. */
export function docToMarkdown(doc: Doc): string {
  const yamlString = (value: string) => JSON.stringify(value);
  return [
    "---",
    `title: ${yamlString(doc.frontmatter.title)}`,
    `description: ${yamlString(doc.frontmatter.description)}`,
    `url: ${siteUrl}${doc.href}`,
    "---",
    "",
    mdxToMarkdown(doc.content),
  ].join("\n");
}

/** Every doc's mirror, keyed by its path relative to the site root, such as "quickstart.md". */
export function buildMarkdownMirrors(): Map<string, string> {
  return new Map(
    getAllDocsMeta().map((doc) => [markdownMirrorHref(doc).slice(1), docToMarkdown(doc)])
  );
}
