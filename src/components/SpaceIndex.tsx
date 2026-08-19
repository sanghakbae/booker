"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSpace } from "@/components/SpaceProvider";
import { EmptyState, Loading } from "./Loading";
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

  if (loading) return <Loading />;
  if (!space) return <EmptyState title="매뉴얼을 찾을 수 없습니다" hint="주소를 다시 확인해 주세요." />;
  return <Loading label="이동 중" />;
}
