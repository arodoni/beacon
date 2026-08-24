import type { Metadata } from "next";
import { UpdateMonitoringPane } from "../../../components/dashboard/UpdateMonitoringPane";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Tools for working on Beacon docs: the Markdown editor and doc-update monitoring.",
};

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
        Dashboard
      </h1>

      <div className="mt-6 rounded-xl border border-slate-900/10 p-6 dark:border-white/10">
        <UpdateMonitoringPane />
      </div>
    </div>
  );
}
