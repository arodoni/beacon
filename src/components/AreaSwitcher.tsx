"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const areas = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Documentation", href: "/" },
];

export function AreaSwitcher() {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");

  return (
    <nav className="flex items-center gap-1 rounded-full bg-slate-900/5 p-1 text-sm dark:bg-white/10">
      {areas.map((area) => {
        const isActive = area.href === "/dashboard" ? isDashboard : !isDashboard;
        return (
          <Link
            key={area.href}
            href={area.href}
            className={`rounded-full px-3 py-1 transition ${
              isActive
                ? "bg-white font-medium text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            }`}
          >
            {area.title}
          </Link>
        );
      })}
    </nav>
  );
}
