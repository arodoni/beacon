"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { nav } from "../../../content/nav.config";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-64 shrink-0 space-y-6 text-sm">
      {nav.map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded-lg px-3 py-1.5 transition ${
                      isActive
                        ? "bg-blue-900/10 font-medium text-blue-900 dark:bg-blue-400/10 dark:text-blue-300"
                        : "text-slate-600 hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                    }`}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
