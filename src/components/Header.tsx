"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

export function Header() {
  const { user, loading, signIn, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-border bg-background/85 backdrop-blur">
      <div
        style={{ maxWidth: "var(--container-width)" }}
        className="mx-auto flex h-full items-center gap-4 px-4"
      >
        <Link href="/" className="font-semibold tracking-tight">
          booker
        </Link>

        <div className="ml-auto flex items-center gap-3 text-sm">
          {loading ? null : user ? (
            <>
              <Link href="/new" className="text-muted hover:text-foreground">
                새 매뉴얼
              </Link>
              <span className="hidden text-muted sm:inline">{user.displayName ?? user.email}</span>
              <button onClick={() => signOut()} className="text-muted hover:text-foreground">
                로그아웃
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn()}
              className="rounded-md border border-border px-3 py-1.5 font-medium hover:bg-surface"
            >
              Google로 로그인
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
