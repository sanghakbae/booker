"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useT } from "./LocaleProvider";
import { useSpace } from "./SpaceProvider";

/** The manual's own top bar, in place of the product header. */
export function ManualHeader() {
  const { space } = useSpace();
  const { user, loading, error, signIn } = useAuth();
  const t = useT();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="brand-rule absolute inset-x-0 top-0 h-0.5" aria-hidden />
      <div
        style={{ maxWidth: "var(--container-width)" }}
        className="mx-auto flex h-14 items-center gap-4 px-4"
      >
        <Link
          href={space ? `/s/${space.slug}` : "/"}
          className="flex h-11 min-w-0 items-center truncate font-semibold tracking-tight"
        >
          {space?.title ?? "booker"}
        </Link>

        <div className="ml-auto flex items-center gap-3 text-sm">
          <LanguageSwitcher />
          {loading ? null : user ? (
            <Link
              href="/manuals"
              className="flex h-11 items-center px-1 text-muted hover:text-foreground"
            >
              {t("header.myManuals")}
            </Link>
          ) : (
            <button
              onClick={() => signIn()}
              className="flex h-11 items-center px-1 text-muted hover:text-foreground"
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

/** A single line of provenance, rather than the product's full footer. */
export function ManualFooter() {
  const t = useT();

  return (
    <footer className="border-t border-border">
      <div
        style={{ maxWidth: "var(--container-width)" }}
        className="mx-auto flex w-full flex-wrap items-center gap-x-5 gap-y-2 px-4 py-5 text-sm text-muted"
      >
        <Link href="/" className="hover:text-foreground">
          Made with booker
        </Link>
        <Link href="/privacy" className="ml-auto hover:text-foreground">
          {t("footer.privacy")}
        </Link>
      </div>
    </footer>
  );
}
