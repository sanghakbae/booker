"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSpace } from "@/components/SpaceProvider";
import { EmptyState, Loading } from "./Loading";
import { useT } from "./LocaleProvider";
import { flattenTree } from "@/lib/db";

/** A space has no page of its own — it lands on the first document. */
export function SpaceIndex() {
  const { space, tree, loading } = useSpace();
  const t = useT();
  const router = useRouter();

  useEffect(() => {
    if (loading || !space) return;
    const first = flattenTree(tree)[0];
    router.replace(first ? `/s/${space.slug}/${first.slug}` : `/s/${space.slug}/new`);
  }, [loading, space, tree, router]);

  if (loading) return <Loading label={t("common.loading")} />;
  if (!space) return <EmptyState title={t("reader.spaceNotFound")} hint={t("reader.checkAddress")} />;
  return <Loading label={t("common.loading")} />;
}
