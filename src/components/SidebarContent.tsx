"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { searchPages } from "@/lib/search";
import type { PageNode } from "@/lib/types";
import { SearchIcon } from "./Icons";
import { useT } from "./LocaleProvider";
import { NewPageButton } from "./NewPageButton";
import { ShareLink } from "./ShareLink";
import { useSpace } from "./SpaceProvider";

function NavItem({
  node,
  spaceSlug,
  depth,
  current,
  onNavigate,
  draftLabel,
}: {
  draftLabel: string;
  node: PageNode;
  spaceSlug: string;
  depth: number;
  current: string;
  onNavigate?: () => void;
}) {
  const active = current === node.slug;
  return (
    <li>
      <Link
        href={`/s/${spaceSlug}/${node.slug}`}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        style={{ paddingLeft: `${0.75 + depth * 0.85}rem` }}
        // 44px tall on touch screens, tighter once a pointer is available.
        className={`block rounded-md py-2.5 pr-3 text-sm leading-snug md:py-1.5 ${
          active
            ? "bg-accent/10 font-medium text-accent"
            : "text-foreground/80 hover:bg-surface hover:text-foreground"
        }`}
      >
        <span className="flex items-center gap-2">
          <span className="min-w-0 flex-1">{node.title}</span>
          {!node.published && (
            /* Bordered and spaced: with only a tint behind it, the badge read
               as part of the title — "소개초안" rather than "소개" + "초안". */
            <span className="shrink-0 rounded border border-border bg-surface px-1.5 py-0.5 text-[11px] leading-none text-muted">
              {draftLabel}
            </span>
          )}
        </span>
      </Link>
      {node.children.length > 0 && (
        <ul className="mt-0.5 space-y-0.5">
          {node.children.map((child) => (
            <NavItem
              key={child.id}
              node={child}
              spaceSlug={spaceSlug}
              depth={depth + 1}
              current={current}
              onNavigate={onNavigate}
              draftLabel={draftLabel}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/** The navigation body, shared by the desktop rail and the mobile drawer. */
export function SidebarContent({
  currentSlug = "",
  onNavigate,
}: {
  /** Which document is on screen. Passed in because the manual root shows the
      first document without putting its address in the URL. */
  currentSlug?: string;
  onNavigate?: () => void;
}) {
  const { space, pages, tree, canEdit } = useSpace();
  const t = useT();
  const [query, setQuery] = useState("");

  const current = currentSlug;
  const hits = useMemo(() => searchPages(pages, query), [pages, query]);

  if (!space) return null;

  return (
    <>
      <Link
        href={`/s/${space.slug}`}
        onClick={onNavigate}
        className="block px-3 pb-4 text-sm font-semibold"
      >
        {space.title}
      </Link>

      <div className="relative mb-3">
        <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("sidebar.searchPlaceholder")}
          aria-label={t("sidebar.searchPlaceholder")}
          className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm"
        />
      </div>

      {query.trim() ? (
        hits.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted">{t("sidebar.noResults")}</p>
        ) : (
          <ul className="space-y-1">
            {hits.map(({ page, snippet }) => (
              <li key={page.id}>
                <Link
                  href={`/s/${space.slug}/${page.slug}`}
                  onClick={onNavigate}
                  className="block rounded-md px-3 py-2 hover:bg-surface"
                >
                  <span className="block text-sm font-medium">{page.title}</span>
                  <span className="mt-0.5 block line-clamp-2 text-xs text-muted">{snippet}</span>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : tree.length === 0 ? (
        <p className="px-3 text-sm text-muted">{t("sidebar.noDocs")}</p>
      ) : (
        <ul className="space-y-0.5">
          {tree.map((node) => (
            <NavItem
              key={node.id}
              node={node}
              spaceSlug={space.slug}
              depth={0}
              current={current}
              onNavigate={onNavigate}
              draftLabel={t("sidebar.draft")}
            />
          ))}
        </ul>
      )}

      {canEdit && !query.trim() && <NewPageButton />}

      <div className="mt-4 space-y-0.5 border-t border-border pt-4">
        <Link
          href={`/s/${space.slug}/print`}
          onClick={onNavigate}
          className="block rounded-md px-3 py-2 text-sm text-muted hover:bg-surface hover:text-foreground"
        >
          {t("sidebar.print")}
        </Link>
        {canEdit && (
          <Link
            href={`/s/${space.slug}/settings`}
            onClick={onNavigate}
            className="block rounded-md px-3 py-2 text-sm text-muted hover:bg-surface hover:text-foreground"
          >
            {t("sidebar.manualSettings")}
          </Link>
        )}
      </div>

      <ShareLink spaceSlug={space.slug} />
    </>
  );
}
