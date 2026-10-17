import type { ReactNode } from "react";
import { Sidebar } from "../../components/docs/Sidebar";
import { TopBar } from "../../components/docs/TopBar";
import { validateNav } from "../../lib/content";

export default function SiteLayout({ children }: { children: ReactNode }) {
  validateNav();

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <TopBar />
      <div className="flex gap-8 px-6 py-6">
        <Sidebar />
        {children}
      </div>
    </div>
  );
}
