"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSpace } from "@/components/SpaceProvider";
import { flattenTree } from "@/lib/db";

/** A space has no page of its own — it lands on the first document. */
export function SpaceIndex() {
  const { space, tree, loading } = useSpace();
  const router = useRouter();

  useEffect(() => {
    if (loading || !space) return;
    const first = flattenTree(tree)[0];
    router.replace(first ? `/s/${space.slug}/${first.slug}` : `/s/${space.slug}/new`);
  }, [loading, space, tree, router]);

  if (loading) return <main className="p-16 text-muted">불러오는 중…</main>;
  if (!space) return <main className="p-16 text-muted">매뉴얼을 찾을 수 없습니다.</main>;
  return <main className="p-16 text-muted">이동 중…</main>;
}
