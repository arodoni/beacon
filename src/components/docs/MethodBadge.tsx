const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300",
  POST: "bg-blue-100 text-blue-800 dark:bg-blue-400/15 dark:text-blue-300",
  PUT: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
  PATCH: "bg-orange-100 text-orange-800 dark:bg-orange-400/15 dark:text-orange-300",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-300",
};
const OTHER_METHOD_COLOR = "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300";

// The sidebar uses light, muted fills with a dark label, in a palette distinct from the page badges.
// Dark mode flips to deep muted fills with a light label.
const METHOD_SOLID_COLORS: Record<string, string> = {
  GET: "bg-[#d5e4e3] text-[#2c4a4b] dark:bg-[#34504f] dark:text-[#d5e4e3]", // dusty teal
  POST: "bg-[#e0dcec] text-[#463e66] dark:bg-[#453f5e] dark:text-[#e0dcec]", // dusty violet
  PUT: "bg-[#ece2cc] text-[#5c4a22] dark:bg-[#56482a] dark:text-[#ece2cc]", // muted ochre
  PATCH: "bg-[#ead9e4] text-[#5a3851] dark:bg-[#563a4f] dark:text-[#ead9e4]", // dusty mauve
  DELETE: "bg-[#eed9d7] text-[#6a3434] dark:bg-[#5c3838] dark:text-[#eed9d7]", // dusty brick
};
const OTHER_METHOD_SOLID_COLOR = "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200";

export function MethodBadge({ method, compact = false }: { method: string; compact?: boolean }) {
  if (compact) {
    // The sidebar's narrow column shortens DELETE and OPTIONS to keep titles aligned.
    const label = method.length > 5 ? method.slice(0, 3) : method;
    return (
      <span
        aria-label={method}
        className={`w-11 shrink-0 rounded-sm py-0.5 text-center font-sans text-[9px] font-bold tracking-[0.12em] ${
          METHOD_SOLID_COLORS[method] ?? OTHER_METHOD_SOLID_COLOR
        }`}
      >
        {label}
      </span>
    );
  }
  return (
    <span
      className={`shrink-0 rounded px-2 py-1 font-mono text-xs font-semibold ${
        METHOD_COLORS[method] ?? OTHER_METHOD_COLOR
      }`}
    >
      {method}
    </span>
  );
}
