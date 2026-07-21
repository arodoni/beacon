import type { ReactNode } from "react";
import { Sidebar } from "../../components/docs/Sidebar";
import { TopBar } from "../../components/docs/TopBar";
import { validateNav } from "../../lib/content";

export default function SiteLayout({ children }: { children: ReactNode }) {
  validateNav();

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <TopBar />
      <div className="mx-auto flex max-w-6xl gap-10 px-6 py-10">
        <Sidebar />
        <article className="prose prose-slate max-w-none flex-1 dark:prose-invert">
          {children}
        </article>
      </div>
    </div>
  );
}
