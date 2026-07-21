import Link from "next/link";
import { SearchDialog } from "./SearchDialog";
import { ThemeToggle } from "./ThemeToggle";

export function TopBar() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-900/10 px-6 py-4 dark:border-white/10">
      <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0d1117] text-white">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M5.5 5.5 4 4M18.5 5.5 20 4M3.5 10H1.5M22.5 10h-2" />
            <circle cx="12" cy="9" r="3" />
            <path d="M9.25 11.5 7 21h10l-2.25-9.5" />
          </svg>
        </span>
        Beacon
      </Link>
      <div className="flex items-center gap-3">
        <SearchDialog />
        <ThemeToggle />
      </div>
    </header>
  );
}
