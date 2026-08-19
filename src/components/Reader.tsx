"use client";

import Link from "next/link";
import { useMemo } from "react";
import { flattenTree } from "@/lib/db";
import { extractToc } from "@/lib/toc";
import { EmptyState, Loading } from "./Loading";
import { Markdown } from "./Markdown";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { Toc } from "./Toc";
import { useSpace } from "./SpaceProvider";

export function Reader({ slug }: { slug: string }) {
  const { space, tree, loading, canEdit } = useSpace();

  const ordered = useMemo(() => flattenTree(tree), [tree]);
  const index = ordered.findIndex((p) => p.slug === slug);
  const current = index >= 0 ? ordered[index] : null;
  const toc = useMemo(() => extractToc(current?.content ?? ""), [current?.content]);

  if (loading) return <Loading />;
  if (!space) {
    return <EmptyState title="매뉴얼을 찾을 수 없습니다" hint="주소를 다시 확인해 주세요." />;
  }

  return (
    <>
      <MobileNav currentTitle={current?.title} />

      <div
        style={{ maxWidth: "var(--container-width)" }}
        className="mx-auto flex w-full flex-1 px-4"
      >
        <Sidebar />

        <main className="min-w-0 flex-1 px-0 py-10 md:px-10">
          {!current ? (
            <EmptyState title="문서를 찾을 수 없습니다" />
          ) : (
            <>
              {canEdit && (
                <div className="mb-6 flex justify-end">
                  <Link
                    href={`/s/${space.slug}/${current.slug}/edit`}
                    className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface"
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
                  <Link
                    href={`/s/${space.slug}/${ordered[index - 1].slug}`}
                    className="py-2 text-accent"
                  >
                    ← {ordered[index - 1].title}
                  </Link>
                )}
                {index < ordered.length - 1 && (
                  <Link
                    href={`/s/${space.slug}/${ordered[index + 1].slug}`}
                    className="ml-auto py-2 text-accent"
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
    </>
  );
}
