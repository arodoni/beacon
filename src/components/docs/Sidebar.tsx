"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getActiveGroup, isNavActive, type SiteNavGroup, type SiteNavItem } from "../../lib/nav";
import { MethodBadge } from "./MethodBadge";

/** Splits items into runs that share a section. Items with no section form one run. */
function groupBySection(items: SiteNavItem[]) {
  const sections: { title?: string; items: SiteNavItem[] }[] = [];
  for (const item of items) {
    const last = sections[sections.length - 1];
    if (last && last.title === item.section) last.items.push(item);
    else sections.push({ title: item.section, items: [item] });
  }
  return sections;
}

/** Endpoint links: a solid method badge, then the title in a slightly tighter font. */
function EndpointItems({ items, pathname }: { items: SiteNavItem[]; pathname: string }) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const isActive = isNavActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-2.5 px-3 py-1.5 text-[13px] tracking-tight transition ${
                isActive
                  ? "font-semibold text-slate-900 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              {item.method && <MethodBadge method={item.method} compact />}
              <span className="min-w-0">{item.title}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function SidebarItems({ items, pathname, nested = false }: { items: SiteNavItem[]; pathname: string; nested?: boolean }) {
  return (
    <ul className={nested ? "mt-0.5 ml-3 space-y-0.5" : "space-y-0.5"}>
      {items.map((item) => {
        const isActive = isNavActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition ${
                isActive
                  ? "bg-blue-900/10 font-medium text-blue-900 dark:bg-blue-400/10 dark:text-blue-300"
                  : "text-slate-600 hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
              }`}
            >
              <span className="min-w-0">{item.title}</span>
            </Link>
            {item.children && item.children.length > 0 && (
              <SidebarItems items={item.children} pathname={pathname} nested />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function Sidebar({ groups }: { groups: SiteNavGroup[] }) {
  const pathname = usePathname();
  const activeGroup = getActiveGroup(pathname, groups);

  if (!activeGroup || activeGroup.items.length === 0) {
    return null;
  }

  return (
    <nav className="sticky top-6 w-70 shrink-0 self-start space-y-6 text-sm">
      <div>
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          {activeGroup.title}
        </p>
        {groupBySection(activeGroup.items).map((section) => (
          <div key={section.title ?? "items"} className="mb-4 last:mb-0">
            {section.title && (
              <p className="mb-1.5 flex items-center justify-between px-3 text-xs font-semibold text-slate-700 dark:text-slate-200">
                {section.title}
                <span className="font-mono text-[10px] font-normal text-slate-400 dark:text-slate-500">
                  {section.items.length}
                </span>
              </p>
            )}
            {section.items.some((item) => item.method) ? (
              <EndpointItems items={section.items} pathname={pathname} />
            ) : (
              <SidebarItems items={section.items} pathname={pathname} />
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}
