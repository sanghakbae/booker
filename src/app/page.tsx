"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Wordmark } from "@/components/Wordmark";
import { listOwnedSpaces, listPublicSpaces, listSharedSpaces } from "@/lib/db";
import type { Space } from "@/lib/types";

export default function HomePage() {
  const { user, signIn } = useAuth();
  const [publicSpaces, setPublicSpaces] = useState<Space[]>([]);
  const [mine, setMine] = useState<Space[]>([]);
  const [shared, setShared] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // State is set from promise callbacks, after the effect body has returned.
    listPublicSpaces()
      .then(setPublicSpaces)
      .catch(() => setPublicSpaces([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMine([]);
       
      setShared([]);
      return;
    }
    listOwnedSpaces(user.uid).then(setMine).catch(() => setMine([]));
    if (user.email) {
      listSharedSpaces(user.email).then(setShared).catch(() => setShared([]));
    }
  }, [user]);

  return (
    <main
      style={{ maxWidth: "var(--container-width)" }}
      className="brand-wash mx-auto w-full px-4 pb-24 pt-16"
    >
      <section className="mb-12" style={{ maxWidth: "var(--content-width)" }}>
        <Wordmark className="text-3xl" />

        <h1 className="brand-text mt-6 text-5xl font-bold leading-[1.15] tracking-tight">
          매뉴얼을 쓰고,
          <br />
          공개하세요
        </h1>

        <p className="mt-5 text-lg leading-relaxed text-muted">
          마크다운으로 쓰면 목차와 검색이 있는 문서 사이트가 됩니다.{" "}
          <span className="nowrap">읽는 데 로그인은 필요 없습니다.</span>
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {user ? (
            <Link
              href="/new"
              className="rounded-lg bg-accent px-5 py-3 font-medium text-accent-foreground shadow-[0_6px_20px_var(--brand-glow)]"
            >
              새 매뉴얼 만들기
            </Link>
          ) : (
            <button
              onClick={() => signIn()}
              className="rounded-lg bg-accent px-5 py-3 font-medium text-accent-foreground shadow-[0_6px_20px_var(--brand-glow)]"
            >
              Google로 시작하기
            </button>
          )}
          <span className="text-sm text-muted">무료 · 설치 없음</span>
        </div>
      </section>

      <section className="mb-16">
        <GlobalSearch />
      </section>

      {mine.length > 0 && <SpaceGrid title="내 매뉴얼" spaces={mine} showVisibility />}

      {shared.length > 0 && (
        <SpaceGrid title="함께 편집하는 매뉴얼" spaces={shared} showVisibility />
      )}

      <SpaceGrid
        title="공개된 매뉴얼"
        spaces={publicSpaces}
        empty={loading ? "불러오는 중…" : "아직 공개된 매뉴얼이 없습니다."}
      />
    </main>
  );
}

function SpaceGrid({
  title,
  spaces,
  empty,
  showVisibility,
}: {
  title: string;
  spaces: Space[];
  empty?: string;
  showVisibility?: boolean;
}) {
  return (
    <section className="mb-14">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wide text-muted">
        <span className="h-3 w-1 rounded-full bg-accent" aria-hidden />
        {title}
      </h2>

      {spaces.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => (
            <li key={space.id}>
              <Link href={`/s/${space.slug}`} className="card block h-full p-5">
                <p className="font-medium">{space.title}</p>
                {space.description && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted">{space.description}</p>
                )}
                <p className="mt-4 flex items-center gap-2 text-xs text-muted">
                  <span className="font-mono">/{space.slug}</span>
                  {showVisibility && space.visibility === "private" && (
                    <span className="rounded-full bg-surface px-2 py-0.5">비공개</span>
                  )}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
