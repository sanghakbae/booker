"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { searchPages } from "@/lib/search";
import type { PageNode } from "@/lib/types";
import { SearchIcon } from "./Icons";
import { NewPageButton } from "./NewPageButton";
import { ShareLink } from "./ShareLink";
import { useSpace } from "./SpaceProvider";

function NavItem({
  node,
  spaceSlug,
  depth,
  current,
  onNavigate,
}: {
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
        {node.title}
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
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/** The navigation body, shared by the desktop rail and the mobile drawer. */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { space, pages, tree, canEdit } = useSpace();
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const current = decodeURIComponent(pathname.split("/")[3] ?? "");
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
          placeholder="문서 검색"
          aria-label="문서 검색"
          className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm"
        />
      </div>

      {query.trim() ? (
        hits.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted">검색 결과가 없습니다.</p>
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
        <p className="px-3 text-sm text-muted">아직 문서가 없습니다.</p>
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
            />
          ))}
        </ul>
      )}

      {canEdit && !query.trim() && <NewPageButton />}

      <ShareLink spaceSlug={space.slug} />
    </>
  );
}
