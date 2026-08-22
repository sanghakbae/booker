"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { flattenTree } from "@/lib/db";
import { useAuth } from "./AuthProvider";
import { EmptyState, Loading } from "./Loading";
import { useT } from "./LocaleProvider";
import { useSpace } from "./SpaceProvider";

/**
 * A manual has no page of its own, so its root lands on the first document.
 *
 * When there is nothing to land on it says so. It used to redirect to the
 * "new document" screen, which meant a reader following a shared link — of a
 * manual whose documents were all still drafts — arrived at someone else's
 * authoring form.
 */
export function SpaceIndex() {
  const { space, tree, loading, canEdit } = useSpace();
  const { loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useT();

  const first = useMemo(() => flattenTree(tree)[0], [tree]);

  useEffect(() => {
    // Waiting for auth matters: signing in reveals unpublished documents, and
    // deciding "there is nothing here" too early would skip past them.
    if (loading || authLoading || !space || !first) return;
    router.replace(`/s/${space.slug}/${first.slug}`);
  }, [loading, authLoading, space, first, router]);

  if (loading || authLoading) return <Loading label={t("common.loading")} />;

  if (!space) {
    return <EmptyState title={t("reader.spaceNotFound")} hint={t("reader.checkAddress")} />;
  }

  if (!first) {
    return canEdit ? (
      <main className="mx-auto w-full max-w-md px-4 py-20 text-center">
        <p className="font-medium">{t("space.noDocsEditor")}</p>
        <p className="mt-2 text-sm text-muted">{t("space.noDocsEditorHint")}</p>
        <Link
          href={`/s/${space.slug}/new`}
          className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-foreground"
        >
          {t("space.createFirstDoc")}
        </Link>
      </main>
    ) : (
      <EmptyState title={t("space.preparing")} hint={t("space.preparingHint")} />
    );
  }

  return <Loading label={t("common.loading")} />;
}
