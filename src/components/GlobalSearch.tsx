"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SearchIcon } from "./Icons";
import { useT } from "./LocaleProvider";

type Entry = {
  spaceSlug: string;
  spaceTitle: string;
  slug: string;
  title: string;
  text: string;
};

/** Search across every published manual, using the index baked at build time. */
export function GlobalSearch() {
  const t = useT();
  const [index, setIndex] = useState<Entry[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/search-index.json")
      .then((res) => (res.ok ? res.json() : []))
      .then(setIndex)
      .catch(() => setIndex([]));
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !index) return [];
    return index
      .map((entry) => {
        const inTitle = entry.title.toLowerCase().includes(q);
        const at = entry.text.toLowerCase().indexOf(q);
        if (!inTitle && at === -1) return null;
        const from = at === -1 ? 0 : Math.max(0, at - 40);
        const snippet =
          (from > 0 ? "…" : "") + entry.text.slice(from, from + 140) + (entry.text.length > from + 140 ? "…" : "");
        return { entry, snippet, inTitle };
      })
      .filter((hit) => hit !== null)
      .sort((a, b) => Number(b.inTitle) - Number(a.inTitle))
      .slice(0, 20);
  }, [index, query]);

  return (
    <div style={{ maxWidth: "var(--content-width)" }}>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search.globalPlaceholder")}
          aria-label={t("search.globalPlaceholder")}
          className="w-full rounded-lg border border-input bg-background py-3 pl-10 pr-4"
        />
      </div>

      {query.trim() && (
        <div className="mt-4 rounded-lg border border-border">
          {index === null ? (
            <p className="px-4 py-3 text-sm text-muted">{t("search.loadingIndex")}</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">{t("sidebar.noResults")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {results.map(({ entry, snippet }) => (
                <li key={`${entry.spaceSlug}/${entry.slug}`}>
                  <Link
                    href={`/s/${entry.spaceSlug}/${entry.slug}`}
                    className="block px-4 py-3 hover:bg-surface"
                  >
                    <span className="block text-xs text-muted">{entry.spaceTitle}</span>
                    <span className="mt-0.5 block text-sm font-medium">{entry.title}</span>
                    <span className="mt-1 block line-clamp-2 text-sm text-muted">{snippet}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
