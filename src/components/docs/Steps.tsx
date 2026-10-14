import type { ReactNode } from "react";

// Uses divs with list roles instead of <ol>/<li> so the typography plugin's
// list styles (markers, padding) don't apply. Step numbers come from a CSS
// counter, so authors don't number steps by hand.
export function Steps({ children }: { children: ReactNode }) {
  return (
    <div role="list" className="my-8 ml-3.5 [counter-reset:step]">
      {children}
    </div>
  );
}

export function Step({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      role="listitem"
      className="relative pb-6 pl-8 [counter-increment:step] last:pb-0 last:[&>[data-step-line]]:hidden"
    >
      <div
        data-step-line
        aria-hidden="true"
        className="absolute top-9 bottom-1 left-0 w-px bg-slate-200 dark:bg-white/10"
      />
      <div
        aria-hidden="true"
        className="absolute top-0 -left-3.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-900 before:content-[counter(step)] dark:bg-white/10 dark:text-slate-50"
      />
      <p className="mt-0 mb-2 pt-0.5 font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </p>
      <div className="[&>:first-child]:mt-0 [&>:last-child]:mb-0">
        {children}
      </div>
    </div>
  );
}
