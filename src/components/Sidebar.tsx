"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PageNode } from "@/lib/types";
import { NewPageButton } from "./NewPageButton";
import { ShareLink } from "./ShareLink";

function NavItem({
  node,
  spaceSlug,
  depth,
  current,
}: {
  node: PageNode;
  spaceSlug: string;
  depth: number;
  current: string;
}) {
  const href = `/s/${spaceSlug}/${node.slug}`;
  const active = current === node.slug;
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        style={{ paddingLeft: `${0.75 + depth * 0.85}rem` }}
        className={`block rounded-md py-1.5 pr-3 text-sm leading-snug ${
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
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function Sidebar({
  spaceSlug,
  spaceTitle,
  tree,
  canEdit,
}: {
  spaceSlug: string;
  spaceTitle: string;
  tree: PageNode[];
  canEdit: boolean;
}) {
  const pathname = usePathname();
  const current = decodeURIComponent(pathname.split("/")[3] ?? "");

  return (
    <nav
      style={{ width: "var(--sidebar-width)" }}
      className="hidden shrink-0 border-r border-border md:block"
    >
      <div className="sticky top-14 max-h-[calc(100dvh-3.5rem)] overflow-y-auto px-3 py-6">
        <Link href={`/s/${spaceSlug}`} className="block px-3 pb-4 text-sm font-semibold">
          {spaceTitle}
        </Link>

        {tree.length === 0 ? (
          <p className="px-3 text-sm text-muted">아직 문서가 없습니다.</p>
        ) : (
          <ul className="space-y-0.5">
            {tree.map((node) => (
              <NavItem
                key={node.id}
                node={node}
                spaceSlug={spaceSlug}
                depth={0}
                current={current}
              />
            ))}
          </ul>
        )}

        {canEdit && <NewPageButton />}

        <ShareLink spaceSlug={spaceSlug} />
      </div>
    </nav>
  );
}
