"use client";

import Fuse from "fuse.js";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SearchEntry } from "../../lib/content";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function close() {
    setOpen(false);
    setQuery("");
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
      if (event.key === "Escape") {
        close();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open || entries.length > 0) return;
    fetch(`${basePath}/search-index.json`)
      .then((res) => res.json())
      .then(setEntries)
      .catch(() => setEntries([]));
  }, [open, entries.length]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const fuse = useMemo(
    () => new Fuse(entries, { keys: ["title", "description", "excerpt"], threshold: 0.35 }),
    [entries]
  );

  const results = query.trim()
    ? fuse.search(query).map((result) => result.item)
    : entries;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 rounded-full border border-slate-900/10 px-4 py-1.5 text-sm text-slate-500 transition hover:bg-slate-900/5 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5"
      >
        <span>Search docs...</span>
        <kbd className="rounded border border-slate-900/10 px-1.5 py-0.5 text-xs dark:border-white/10">
          ⌘K
        </kbd>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/40 px-4 pt-24 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-900/10 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search docs..."
              className="w-full border-b border-slate-900/10 bg-transparent px-5 py-4 text-sm outline-none dark:border-white/10 dark:text-white"
            />
            <ul className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 ? (
                <li className="px-3 py-4 text-sm text-slate-500 dark:text-slate-400">
                  No results.
                </li>
              ) : (
                results.map((entry) => (
                  <li key={entry.href}>
                    <Link
                      href={entry.href}
                      onClick={close}
                      className="block rounded-xl px-3 py-2 transition hover:bg-slate-900/5 dark:hover:bg-white/5"
                    >
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {entry.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {entry.description}
                      </p>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
