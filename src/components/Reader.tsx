"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { findPageBySlug, flattenTree } from "@/lib/db";
import { extractToc } from "@/lib/toc";
import { EmptyState, Loading } from "./Loading";
import { useT } from "./LocaleProvider";
import { Markdown } from "./Markdown";
import { MobileNav } from "./MobileNav";
import { PageFeedback } from "./PageFeedback";
import { Sidebar } from "./Sidebar";
import { Toc } from "./Toc";
import { useSpace } from "./SpaceProvider";

export function Reader({ slug }: { slug: string }) {
  const { space, pages, tree, drafts, loading, canEdit } = useSpace();
  const t = useT();
  const router = useRouter();

  const ordered = useMemo(() => flattenTree(tree), [tree]);
  const resolved = useMemo(() => findPageBySlug(ordered, slug), [ordered, slug]);
  const index = resolved.page ? ordered.findIndex((p) => p.id === resolved.page!.id) : -1;
  const current = index >= 0 ? ordered[index] : null;

  // An old address still opens the document; the URL then settles on the
  // current one so what gets copied and indexed is the canonical link.
  useEffect(() => {
    if (!space || !resolved.viaAlias || !resolved.page) return;
    router.replace(`/s/${space.slug}/${resolved.page.slug}`);
  }, [space, resolved, router]);
  const toc = useMemo(() => extractToc(current?.content ?? ""), [current?.content]);

  if (loading) return <Loading label={t("common.loading")} />;
  if (!space) {
    return <EmptyState title={t("reader.spaceNotFound")} hint={t("reader.checkAddress")} />;
  }

  return (
    <>
      <MobileNav currentTitle={current?.title} currentSlug={current?.slug} />

      <div
        style={{ maxWidth: "var(--container-width)" }}
        className="mx-auto flex w-full flex-1 px-4"
      >
        <Sidebar currentSlug={current?.slug} />

        <main className="min-w-0 flex-1 px-0 py-10 md:px-10">
          {/* A public manual with nothing published looks empty to everyone who
              has the link, and the owner cannot tell from their own view. */}
          {canEdit &&
            space.visibility === "public" &&
            !pages.some((page) => page.published) && (
              <p
                data-screen-only
                className="doc-aligned mb-6 rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning"
              >
                {t("space.publicNoDocs")}
              </p>
            )}

          {!current ? (
            <EmptyState title={t("reader.pageNotFound")} />
          ) : (
            <>
              {!current.published && (
                <p className="doc-aligned mb-6 rounded-md bg-surface px-4 py-3 text-sm text-muted">
                  {t("reader.unpublishedNotice")}
                </p>
              )}

              {canEdit && (
                <div data-screen-only className="doc-aligned mb-6 flex justify-end">
                  <Link
                    href={`/s/${space.slug}/${current.slug}/edit`}
                    className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface"
                  >
                    {t("reader.edit")}
                  </Link>
                </div>
              )}

              <Markdown
                content={
                  current.published
                    ? current.content
                    : (drafts.get(current.id)?.content ?? current.content)
                }
              />

              <nav
                data-screen-only
                className="doc-aligned mt-16 flex gap-4 border-t border-border pt-6 text-sm"
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

              {current.published && space.visibility === "public" && (
                <PageFeedback spaceId={space.id} pageId={current.id} pageSlug={current.slug} />
              )}
            </>
          )}
        </main>

        <Toc items={toc} />
      </div>
    </>
  );
}
