import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Tools for working on Beacon docs: the Markdown editor and doc-update observability.",
};

const links = [
  {
    title: "Editor",
    href: "/dashboard/editor",
    description: "Write Markdown and see it rendered live.",
  },
  {
    title: "Observability",
    href: "/dashboard/observability",
    description: "See what the doc-update automation has suggested.",
  },
];

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
        Dashboard
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        Tools for working on Beacon docs.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-slate-900/10 p-4 transition hover:bg-slate-900/5 dark:border-white/10 dark:hover:bg-white/5"
          >
            <p className="font-medium text-slate-900 dark:text-white">{link.title}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{link.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
