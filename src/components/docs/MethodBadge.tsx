const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300",
  POST: "bg-blue-100 text-blue-800 dark:bg-blue-400/15 dark:text-blue-300",
  PUT: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
  PATCH: "bg-orange-100 text-orange-800 dark:bg-orange-400/15 dark:text-orange-300",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-300",
};
const OTHER_METHOD_COLOR = "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300";

export function MethodBadge({ method, compact = false }: { method: string; compact?: boolean }) {
  // The sidebar's narrow column shortens DELETE and OPTIONS to keep titles aligned.
  const label = compact && method.length > 5 ? method.slice(0, 3) : method;
  return (
    <span
      aria-label={compact ? method : undefined}
      className={`shrink-0 rounded font-mono font-semibold ${compact ? "w-10 py-0.5 text-center text-[10px]" : "px-2 py-1 text-xs"} ${
        METHOD_COLORS[method] ?? OTHER_METHOD_COLOR
      }`}
    >
      {label}
    </span>
  );
}
