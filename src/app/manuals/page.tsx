"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Loading } from "@/components/Loading";
import { isAdmin } from "@/lib/admin";
import { listAllSpaces, listOwnedSpaces, listSharedSpaces, updateSpace } from "@/lib/db";
import type { Space } from "@/lib/types";

export default function ManualsPage() {
  const { user, loading, signIn } = useAuth();
  const [mine, setMine] = useState<Space[] | null>(null);
  const [shared, setShared] = useState<Space[]>([]);
  const [all, setAll] = useState<Space[]>([]);

  const operator = isAdmin(user?.email);

  const load = useCallback(async () => {
    if (!user) return;
    const [owned, invited, everything] = await Promise.all([
      listOwnedSpaces(user.uid).catch(() => []),
      user.email ? listSharedSpaces(user.email).catch(() => []) : Promise.resolve([]),
      // The rules reject an unfiltered listing for anyone but the operator.
      isAdmin(user.email) ? listAllSpaces().catch(() => []) : Promise.resolve([]),
    ]);
    setMine(owned);
    setShared(invited);
    setAll(everything);
  }, [user]);

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMine(null);
       
      setShared([]);
       
      setAll([]);
      return;
    }
    void load();
  }, [user, load]);

  if (loading) return <Loading />;

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">내 매뉴얼</h1>
        <p className="mt-3 text-muted">매뉴얼을 만들고 관리하려면 로그인이 필요합니다.</p>
        <button
          onClick={() => signIn()}
          className="mt-6 rounded-lg bg-accent px-5 py-3 font-medium text-accent-foreground"
        >
          Google로 로그인
        </button>
      </main>
    );
  }

  return (
    <main
      style={{ maxWidth: "var(--container-width)" }}
      className="mx-auto w-full px-4 pb-24 pt-14"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">내 매뉴얼</h1>
          <p className="mt-2 text-muted">{user.displayName ?? user.email}</p>
        </div>
        <Link
          href="/new"
          className="rounded-lg bg-accent px-4 py-2.5 font-medium text-accent-foreground"
        >
          새 매뉴얼
        </Link>
      </div>

      {mine === null ? (
        <Loading label="매뉴얼을 불러오는 중" />
      ) : mine.length === 0 ? (
        <div className="mt-10 rounded-xl border border-border p-10 text-center">
          <p className="font-medium">아직 만든 매뉴얼이 없습니다</p>
          <p className="mt-2 text-sm text-muted">
            이름만 정하면 시작할 수 있습니다. 템플릿으로 골격까지 채워집니다.
          </p>
          <Link
            href="/new"
            className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-foreground"
          >
            첫 매뉴얼 만들기
          </Link>
        </div>
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mine.map((space) => (
            <li key={space.id}>
              <ManualCard space={space} onChanged={load} />
            </li>
          ))}
        </ul>
      )}

      {shared.length > 0 && (
        <section className="mt-16">
          <h2 className="flex items-center gap-3 text-[1.75rem] font-semibold tracking-tight text-muted">
            <span className="h-6 w-1.5 rounded-full bg-accent" aria-hidden />
            함께 편집하는 매뉴얼
          </h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shared.map((space) => (
              <li key={space.id}>
                <Link href={`/s/${space.slug}`} className="card block h-full p-5">
                  <p className="font-medium">{space.title}</p>
                  {space.description && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted">{space.description}</p>
                  )}
                  <p className="mt-4 font-mono text-xs text-muted">/{space.slug}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {operator && (
        <section className="mt-16">
          <h2 className="flex items-center gap-3 text-[1.75rem] font-semibold tracking-tight text-muted">
            <span className="h-6 w-1.5 rounded-full bg-accent" aria-hidden />
            사이트 전체 매뉴얼
          </h2>
          <p className="mt-2 text-sm text-muted">
            운영자 계정에만 보입니다. 열람만 가능하고, 다른 사람의 매뉴얼을 편집하거나 삭제할 수는
            없습니다.
          </p>

          <ul className="mt-5 divide-y divide-border rounded-xl border border-border">
            {all.map((space) => (
              <li key={space.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                <Link href={`/s/${space.slug}`} className="min-w-0 font-medium hover:text-accent">
                  {space.title}
                </Link>
                <span className="font-mono text-xs text-muted">/{space.slug}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    space.visibility === "public"
                      ? "bg-success/12 text-success"
                      : "bg-surface text-muted"
                  }`}
                >
                  {space.visibility === "public" ? "공개" : "비공개"}
                </span>
                {space.ownerId === user.uid ? (
                  <span className="ml-auto text-xs text-muted">내 매뉴얼</span>
                ) : (
                  <span className="ml-auto font-mono text-xs text-muted">
                    소유자 {space.ownerId.slice(0, 8)}…
                  </span>
                )}
              </li>
            ))}
            {all.length === 0 && (
              <li className="px-4 py-3 text-sm text-muted">불러올 매뉴얼이 없습니다.</li>
            )}
          </ul>
        </section>
      )}

      <section className="mt-16">
        <h2 className="flex items-center gap-3 text-[1.75rem] font-semibold tracking-tight text-muted">
          <span className="h-6 w-1.5 rounded-full bg-accent" aria-hidden />
          공개된 매뉴얼 검색
        </h2>
        <p className="mt-2 text-sm text-muted">
          공개로 발행된 문서를 대상으로 찾습니다. 비공개 매뉴얼은 검색되지 않습니다.
        </p>
        <div className="mt-4">
          <GlobalSearch />
        </div>
      </section>
    </main>
  );
}

/** One owned manual, with the publish switch the owner reaches for most. */
function ManualCard({ space, onChanged }: { space: Space; onChanged: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const isPublic = space.visibility === "public";

  const toggle = async () => {
    setBusy(true);
    try {
      await updateSpace(space.id, { visibility: isPublic ? "private" : "public" });
      await onChanged();
    } catch (err) {
      window.alert(`변경에 실패했습니다: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card flex h-full flex-col p-5">
      <Link href={`/s/${space.slug}`} className="min-w-0">
        <p className="font-medium">{space.title}</p>
        {space.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-muted">{space.description}</p>
        )}
        <p className="mt-4 font-mono text-xs text-muted">/{space.slug}</p>
      </Link>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            isPublic ? "bg-success/12 text-success" : "bg-surface text-muted"
          }`}
        >
          {isPublic ? "공개" : "비공개"}
        </span>

        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            disabled={busy}
            className="text-sm text-muted hover:text-foreground disabled:opacity-40"
          >
            {busy ? "변경 중…" : isPublic ? "비공개로" : "공개로"}
          </button>
          <Link
            href={`/s/${space.slug}/settings`}
            className="text-sm text-muted hover:text-foreground"
          >
            설정
          </Link>
        </div>
      </div>
    </div>
  );
}
