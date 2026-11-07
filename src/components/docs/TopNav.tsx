"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getActiveGroup, type SiteNavGroup } from "../../lib/nav";

export function TopNav({ groups }: { groups: SiteNavGroup[] }) {
  const pathname = usePathname();
  const activeGroup = getActiveGroup(pathname, groups);

  return (
    <nav className="flex items-center gap-1 text-sm">
      {groups.map((group) => (
        <Link
          key={group.title}
          href={group.href}
          className={`rounded-full px-3 py-1.5 transition ${
            group === activeGroup
              ? "bg-slate-900/5 font-medium text-slate-900 dark:bg-white/10 dark:text-white"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          }`}
        >
          {group.title}
        </Link>
      ))}
    </nav>
  );
}
