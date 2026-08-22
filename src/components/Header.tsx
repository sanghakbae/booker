"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useT } from "./LocaleProvider";
import { Wordmark } from "./Wordmark";

export function Header() {
  const { user, loading, error, signIn, signOut } = useAuth();
  const t = useT();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="brand-rule absolute inset-x-0 top-0 h-0.5" aria-hidden />
      <div
        style={{ maxWidth: "var(--container-width)" }}
        className="mx-auto flex h-14 items-center gap-4 px-4"
      >
        <Link href="/" className="flex h-11 items-center text-lg">
          <Wordmark />
        </Link>

        <div className="ml-auto flex items-center gap-3 text-sm">
          {/* Left of the account controls: readers reach for it before they
              ever think about signing in. */}
          <LanguageSwitcher />

          {loading ? null : user ? (
            <>
              <Link
                href="/manuals"
                className="flex h-11 items-center px-1 text-muted hover:text-foreground"
              >
                {t("header.myManuals")}
              </Link>
              <span className="hidden text-muted sm:inline">{user.displayName ?? user.email}</span>
              <button
                onClick={() => signOut()}
                className="flex h-11 items-center px-1 text-muted hover:text-foreground"
              >
                {t("common.signOut")}
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn()}
              className="flex h-11 items-center rounded-md border border-border px-3 font-medium hover:bg-surface"
            >
              {t("common.signIn")}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="border-t border-border bg-red-500/10 px-4 py-2 text-center text-sm text-red-600">
          {error.key ? t(error.key) : error.text}
        </p>
      )}
    </header>
  );
}
