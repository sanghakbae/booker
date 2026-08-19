"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Markdown } from "@/components/Markdown";
import { Sidebar } from "@/components/Sidebar";
import { Toc } from "@/components/Toc";
import { useSpace } from "@/components/SpaceProvider";
import { flattenTree } from "@/lib/db";
import { extractToc } from "@/lib/toc";

export function Reader({ slug }: { slug: string }) {
  const { space, tree, loading, canEdit } = useSpace();

  const ordered = useMemo(() => flattenTree(tree), [tree]);
  const index = ordered.findIndex((p) => p.slug === slug);
  const current = index >= 0 ? ordered[index] : null;
  const toc = useMemo(() => extractToc(current?.content ?? ""), [current?.content]);

  if (loading) return <main className="p-16 text-muted">불러오는 중…</main>;
  if (!space) return <main className="p-16 text-muted">매뉴얼을 찾을 수 없습니다.</main>;

  return (
    <div
      style={{ maxWidth: "var(--container-width)" }}
      className="mx-auto flex w-full flex-1 px-4"
    >
      <Sidebar spaceSlug={space.slug} spaceTitle={space.title} tree={tree} canEdit={canEdit} />

      <main className="min-w-0 flex-1 px-0 py-10 md:px-10">
        {!current ? (
          <p className="text-muted">문서를 찾을 수 없습니다.</p>
        ) : (
          <>
            {canEdit && (
              <div className="mb-6 flex gap-3 text-sm">
                <Link
                  href={`/s/${space.slug}/${current.slug}/edit`}
                  className="rounded-md border border-border px-3 py-1.5 hover:bg-surface"
                >
                  편집
                </Link>
              </div>
            )}

            <Markdown content={current.content} />

            <nav
              style={{ maxWidth: "var(--content-width)" }}
              className="mt-16 flex gap-4 border-t border-border pt-6 text-sm"
            >
              {index > 0 && (
                <Link href={`/s/${space.slug}/${ordered[index - 1].slug}`} className="text-accent">
                  ← {ordered[index - 1].title}
                </Link>
              )}
              {index < ordered.length - 1 && (
                <Link
                  href={`/s/${space.slug}/${ordered[index + 1].slug}`}
                  className="ml-auto text-accent"
                >
                  {ordered[index + 1].title} →
                </Link>
              )}
            </nav>
          </>
        )}
      </main>

      <Toc items={toc} />
    </div>
  );
}
