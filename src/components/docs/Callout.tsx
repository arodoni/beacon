import type { ReactNode } from "react";

type CalloutType = "note" | "tip" | "important" | "warning";

const ICONS: Record<CalloutType, ReactNode> = {
  note: (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a1 1 0 0 0 0 2v3a1 1 0 0 0 1 1h1a1 1 0 1 0 0-2v-3a1 1 0 0 0-1-1H9Z"
        clipRule="evenodd"
      />
    </svg>
  ),
  tip: (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10 2a6 6 0 0 0-3.5 10.9c.4.3.5.7.5 1.1v.5a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-.5c0-.4.1-.8.5-1.1A6 6 0 0 0 10 2ZM8 17a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-.5H8V17Z" />
    </svg>
  ),
  important: (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0Zm-8-5a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1Zm0 9a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M9.1 3.4c.4-.8 1.4-.8 1.8 0l7.2 12.9c.4.8-.1 1.7-1 1.7H2.9c-.9 0-1.4-.9-1-1.7L9.1 3.4ZM10 8a1 1 0 0 0-1 1v3a1 1 0 1 0 2 0V9a1 1 0 0 0-1-1Zm0 7a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

const LABELS: Record<CalloutType, string> = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
};

const STYLES: Record<CalloutType, string> = {
  note: "border-blue-500/30 bg-blue-500/8 text-blue-900 dark:text-blue-100 [&_svg]:text-blue-500",
  tip: "border-emerald-500/30 bg-emerald-500/8 text-emerald-900 dark:text-emerald-100 [&_svg]:text-emerald-500",
  important:
    "border-violet-500/30 bg-violet-500/8 text-violet-900 dark:text-violet-100 [&_svg]:text-violet-500",
  warning:
    "border-amber-500/30 bg-amber-500/8 text-amber-900 dark:text-amber-100 [&_svg]:text-amber-500",
};

export function Callout({
  type = "note",
  children,
}: {
  type?: CalloutType;
  children: ReactNode;
}) {
  return (
    <div
      role="note"
      className={`not-prose my-6 flex gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed ${STYLES[type]}`}
    >
      <div className="mt-0.5 h-5 w-5 shrink-0">{ICONS[type]}</div>
      <div>
        <p className="mb-1 font-semibold">{LABELS[type]}</p>
        <div className="[&>p]:m-0">{children}</div>
      </div>
    </div>
  );
}
