"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "../../lib/toc";

// Distance from the top of the viewport a heading must cross to count as
// "current" - keeps the active item in sync with what's actually visible
// just below the sticky top bar, rather than the very top pixel.
const ACTIVE_OFFSET_PX = 120;

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const headingElements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);

    if (headingElements.length === 0) return;

    function updateActiveHeading() {
      let current = headingElements[0].id;
      for (const el of headingElements) {
        if (el.getBoundingClientRect().top > ACTIVE_OFFSET_PX) break;
        current = el.id;
      }
      setActiveId(current);
    }

    updateActiveHeading();
    window.addEventListener("scroll", updateActiveHeading, { passive: true });
    window.addEventListener("resize", updateActiveHeading);
    return () => {
      window.removeEventListener("scroll", updateActiveHeading);
      window.removeEventListener("resize", updateActiveHeading);
    };
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav className="hidden w-56 shrink-0 self-start xl:block sticky top-10 text-sm">
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        On This Page
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`block rounded-lg px-3 py-1.5 transition ${
                item.depth === 3 ? "pl-6" : ""
              } ${
                activeId === item.id
                  ? "font-medium text-blue-900 dark:text-blue-300"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
