"use client";

import { useState, type ReactNode } from "react";

/** Language switcher. Inactive panels stay in the static HTML, hidden, so they load instantly. */
export function CodeSamples({ labels, children }: { labels: string[]; children: ReactNode[] }) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="not-prose flex gap-1 border-b border-slate-900/10 dark:border-white/10">
        {labels.map((label, i) => (
          <button
            key={label}
            type="button"
            aria-pressed={i === active}
            onClick={() => setActive(i)}
            className={`-mb-px border-b-2 px-3 py-1.5 text-sm transition ${
              i === active
                ? "border-blue-600 font-medium text-slate-900 dark:border-blue-400 dark:text-white"
                : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {children.map((panel, i) => (
        <div key={labels[i]} hidden={i !== active}>
          {panel}
        </div>
      ))}
    </div>
  );
}
