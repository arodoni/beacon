import type { Metadata } from "next";
import { MarkdownWorkspace } from "../../../components/MarkdownWorkspace";

export const metadata: Metadata = {
  title: "Editor",
  description: "Write Markdown and see it rendered live.",
};

export default function EditorPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
        Editor
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        Write Markdown in the editor and see the rendered preview update
        instantly. Nothing here is saved, it&apos;s just a sandbox.
      </p>
      <div className="mt-6">
        <MarkdownWorkspace />
      </div>
    </div>
  );
}
