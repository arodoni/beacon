import type { ReactNode } from "react";
import { DashboardNav } from "../../../components/dashboard/DashboardNav";
import { DashboardTopBar } from "../../../components/dashboard/DashboardTopBar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <DashboardTopBar />
      <div className="mx-auto flex max-w-6xl gap-10 px-6 py-10">
        <DashboardNav />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
