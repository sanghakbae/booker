"use client";

import Link from "next/link";
import { useMemo } from "react";
import { flattenTree } from "@/lib/db";
import { useAuth } from "./AuthProvider";
import { EmptyState, Loading } from "./Loading";
import { useT } from "./LocaleProvider";
import { Reader } from "./Reader";
import { useSpace } from "./SpaceProvider";

/**
 * A manual has no page of its own, so its root shows the first document.
 *
 * It renders that document in place rather than redirecting to it. The redirect
 * cost an extra client navigation, which showed as a blank frame when the
 * manual is embedded in an iframe, and it briefly put the wrong URL in history.
 *
 * Earlier it redirected to the "new document" screen when there was nothing to
 * show, which sent a reader following a shared link into someone else's
 * authoring form.
 */
export function SpaceIndex({ fallbackSlug }: { fallbackSlug?: string }) {
  const { space, tree, loading, canEdit } = useSpace();
  const { loading: authLoading } = useAuth();
  const t = useT();

  const first = useMemo(() => flattenTree(tree)[0], [tree]);

  // fallbackSlug is the first published document known at build time. Deciding
  // this before the auth check is what lets a prerendered root ship with real
  // content instead of a loading state.
  const slug = first?.slug ?? fallbackSlug;
  if (slug) return <Reader slug={slug} />;

  // Waiting for auth matters: signing in reveals unpublished documents, so
  // concluding "there is nothing here" too early would skip past them.
  if (loading || authLoading) return <Loading label={t("common.loading")} />;

  if (!space) {
    return <EmptyState title={t("reader.spaceNotFound")} hint={t("reader.checkAddress")} />;
  }

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
