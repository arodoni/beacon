"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { title: "Overview", href: "/dashboard" },
  { title: "Editor", href: "/dashboard/editor" },
  { title: "Observability", href: "/dashboard/observability" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="w-64 shrink-0 space-y-0.5 text-sm">
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-lg px-3 py-1.5 transition ${
              isActive
                ? "bg-blue-900/10 font-medium text-blue-900 dark:bg-blue-400/10 dark:text-blue-300"
                : "text-slate-600 hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
            }`}
          >
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
