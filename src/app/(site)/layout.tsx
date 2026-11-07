import type { ReactNode } from "react";
import { Sidebar } from "../../components/docs/Sidebar";
import { TopBar } from "../../components/docs/TopBar";
import { nav } from "../../../content/nav.config";
import { validateNav } from "../../lib/content";
import { withApiReference } from "../../lib/nav";
import { getApiReferenceNavGroup } from "../../lib/openapi";

export default function SiteLayout({ children }: { children: ReactNode }) {
  validateNav();
  const groups = withApiReference(nav, getApiReferenceNavGroup());

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <TopBar groups={groups} />
      <div className="flex gap-8 px-6 py-6">
        <Sidebar groups={groups} />
        {children}
      </div>
    </div>
  );
}
