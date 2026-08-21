"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { Wordmark } from "./Wordmark";

export function Header() {
  const { user, loading, error, signIn, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="brand-rule absolute inset-x-0 top-0 h-0.5" aria-hidden />
      <div
        style={{ maxWidth: "var(--container-width)" }}
        className="mx-auto flex h-14 items-center gap-4 px-4"
      >
        <Link href="/" className="flex h-11 items-center text-lg">
          <Wordmark />
        </Link>

        <div className="ml-auto flex items-center gap-3 text-sm">
          {loading ? null : user ? (
            <>
              <Link
                href="/manuals"
                className="flex h-11 items-center px-1 text-muted hover:text-foreground"
              >
                내 매뉴얼
              </Link>
              <span className="hidden text-muted sm:inline">{user.displayName ?? user.email}</span>
              <button
                onClick={() => signOut()}
                className="flex h-11 items-center px-1 text-muted hover:text-foreground"
              >
                로그아웃
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn()}
              className="flex h-11 items-center rounded-md border border-border px-3 font-medium hover:bg-surface"
            >
              Google로 로그인
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="border-t border-border bg-red-500/10 px-4 py-2 text-center text-sm text-red-600">
          {error}
        </p>
      )}
    </header>
  );
}
