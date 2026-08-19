"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { listOwnedSpaces, listPublicSpaces } from "@/lib/db";
import type { Space } from "@/lib/types";

export default function HomePage() {
  const { user, signIn } = useAuth();
  const [publicSpaces, setPublicSpaces] = useState<Space[]>([]);
  const [mine, setMine] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // State is set from promise callbacks, after the effect body has already returned.
     
    listPublicSpaces()
      .then(setPublicSpaces)
      .catch(() => setPublicSpaces([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMine([]);
      return;
    }
     
    listOwnedSpaces(user.uid).then(setMine).catch(() => setMine([]));
  }, [user]);

  return (
    <main style={{ maxWidth: "var(--container-width)" }} className="mx-auto w-full px-4 py-16">
      <section className="mb-16" style={{ maxWidth: "var(--content-width)" }}>
        <h1 className="text-4xl font-bold tracking-tight">매뉴얼을 쓰고, 공개하세요</h1>
        <p className="mt-4 text-lg text-muted">
          마크다운으로 작성하면 목차와 검색이 있는 문서 사이트가 됩니다. 읽는 데는 로그인이
          필요하지 않습니다.
        </p>
        {!user && (
          <button
            onClick={() => signIn()}
            className="mt-6 rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground"
          >
            Google로 시작하기
          </button>
        )}
      </section>

      {mine.length > 0 && (
        <SpaceGrid title="내 매뉴얼" spaces={mine} showVisibility />
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
      <h2 className="mb-4 text-sm font-semibold tracking-wide text-muted">{title}</h2>
      {spaces.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => (
            <li key={space.id}>
              <Link
                href={`/s/${space.slug}`}
                className="block h-full rounded-lg border border-border p-5 hover:border-accent"
              >
                <p className="font-medium">{space.title}</p>
                {space.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{space.description}</p>
                )}
                <p className="mt-3 text-xs text-muted">
                  /{space.slug}
                  {showVisibility && space.visibility === "private" && " · 비공개"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
