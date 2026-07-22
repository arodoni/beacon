"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const DEFAULT_DOCUMENT = `# Beacon

Welcome to Beacon — an open-source writing experience for docs and product content.

## What you can do here

- Write Markdown in the left editor.
- Preview formatted docs instantly in the right pane.
- Use headings, lists, tables, task lists, and code blocks.

## Why Beacon?

Beacon is built for fast docs workflows and Vercel deployment. It is designed to feel polished while staying simple and extensible.

### Sample code

\`\`\`tsx
function highlight(message: string) {
  return message.toUpperCase();
}

console.log(highlight("Beacon"));
\`\`\`

### Try it now

Edit the Markdown above and see the preview update live.
`;

export function MarkdownWorkspace() {
  const [content, setContent] = useState(DEFAULT_DOCUMENT);
  const preview = useMemo(() => content, [content]);

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(320px,1fr)_minmax(420px,1.2fr)]">
      <div className="rounded-[2rem] border border-slate-900/10 bg-slate-50 p-6 shadow-xl dark:border-white/10 dark:bg-slate-950/80 dark:shadow-slate-950/40">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-blue-800 dark:text-blue-300/80">
              Editor
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">
              Write in Markdown
            </h2>
          </div>
          <span className="rounded-full border border-blue-900/20 bg-blue-900/10 px-3 py-1 text-sm font-semibold text-blue-900 dark:border-blue-300/20 dark:bg-blue-300/10 dark:text-blue-200">
            Live preview
          </span>
        </div>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="min-h-[42rem] w-full resize-none rounded-[1.75rem] border border-slate-900/10 bg-white px-5 py-5 text-sm leading-6 text-slate-800 outline-none transition ring-1 ring-transparent focus:border-blue-800/70 focus:ring-blue-800/20 dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100 dark:focus:border-blue-300/90 dark:focus:ring-blue-300/20"
          spellCheck={false}
          aria-label="Markdown editor"
        />
      </div>

      <div className="rounded-[2rem] border border-slate-900/10 bg-slate-50 p-6 shadow-xl dark:border-white/10 dark:bg-slate-950/80 dark:shadow-slate-950/40">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
              Preview
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">
              Polished docs output
            </h2>
          </div>
          <span className="rounded-full border border-slate-500/10 bg-slate-900/5 px-3 py-1 text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300">
            Markdown rendered live
          </span>
        </div>

        <div
          data-testid="markdown-preview"
          className="prose prose-slate max-w-none overflow-hidden rounded-[1.75rem] border border-slate-900/10 bg-white p-6 shadow-inner dark:prose-invert dark:border-white/10 dark:bg-slate-900/95 dark:shadow-black/20"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{preview}</ReactMarkdown>
        </div>
      </div>
    </section>
  );
}
