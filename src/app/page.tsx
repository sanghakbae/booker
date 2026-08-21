"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useT } from "@/components/LocaleProvider";
import { Wordmark } from "@/components/Wordmark";

const FEATURE_KEYS = ["f1", "f2", "f3", "f4", "f5", "f6"] as const;
const STEP_KEYS = ["s1", "s2", "s3"] as const;

export default function LandingPage() {
  const { user, loading, signIn } = useAuth();
  const t = useT();

  return (
    <main className="w-full">
      {/* ---- hero ---- */}
      <section
        style={{ maxWidth: "var(--container-width)" }}
        className="brand-wash mx-auto w-full px-4 pb-10 pt-10 sm:pt-14"
      >
        <div style={{ maxWidth: "var(--content-width)" }}>
          <Wordmark className="text-3xl" />

          {/* The break sits on the comma — a clause boundary — so the two lines
              read as a deliberate pair. `text-balance` keeps the rag even when
              the line wraps on its own anyway. */}
          <h1 className="brand-text mt-7 text-balance text-4xl font-bold leading-[1.18] tracking-tight sm:text-5xl">
            {t("landing.headline1")}
            <br />
            {t("landing.headline2")}
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-muted">
            {t("landing.sub1")}{" "}
            <span className="nowrap">{t("landing.sub2")}</span>
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            {loading ? null : user ? (
              <Link
                href="/manuals"
                className="rounded-lg bg-accent px-5 py-3 font-medium text-accent-foreground shadow-[0_6px_20px_var(--brand-glow)]"
              >
                {t("landing.ctaGo")}
              </Link>
            ) : (
              <button
                onClick={() => signIn()}
                className="rounded-lg bg-accent px-5 py-3 font-medium text-accent-foreground shadow-[0_6px_20px_var(--brand-glow)]"
              >
                {t("header.start")}
              </button>
            )}

            <Link
              href="/s/guide/시작하기"
              className="rounded-lg border border-border px-5 py-3 font-medium hover:bg-surface"
            >
              {t("landing.ctaGuide")}
            </Link>
          </div>

          <p className="mt-5 text-sm text-muted">
            {t("landing.note")}
          </p>
        </div>
      </section>

      {/* ---- features ---- */}
      <section className="border-t border-border">
        <div
          style={{ maxWidth: "var(--container-width)" }}
          className="mx-auto w-full px-4 py-10"
        >
          <h2 className="flex items-center gap-3 text-xl font-semibold tracking-tight text-muted">
            <span className="h-5 w-1.5 rounded-full bg-accent" aria-hidden />
            {t("landing.featuresTitle")}
          </h2>

          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_KEYS.map((key) => (
              <li key={key} className="rounded-xl border border-border p-6">
                <h3 className="font-semibold">{t(`landing.${key}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {t(`landing.${key}.body`)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- how it works ---- */}
      <section className="border-t border-border bg-surface">
        <div
          style={{ maxWidth: "var(--container-width)" }}
          className="mx-auto w-full px-4 py-10"
        >
          <h2 className="flex items-center gap-3 text-xl font-semibold tracking-tight text-muted">
            <span className="h-5 w-1.5 rounded-full bg-accent" aria-hidden />
            {t("landing.stepsTitle")}
          </h2>

          <ol className="mt-8 grid gap-5 sm:grid-cols-3">
            {STEP_KEYS.map((key, index) => (
              <li key={key} className="rounded-xl border border-border bg-background p-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-semibold">{t(`landing.${key}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {t(`landing.${key}.body`)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---- closing call to action ---- */}
      <section className="border-t border-border">
        <div
          style={{ maxWidth: "var(--container-width)" }}
          className="mx-auto w-full px-4 pb-[100px] pt-12 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight">
            {t("landing.closingTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            {t("landing.closingBody")}
          </p>

          <div className="mt-8 flex justify-center">
            {loading ? null : user ? (
              <Link
                href="/new"
                className="rounded-lg bg-accent px-6 py-3 font-medium text-accent-foreground"
              >
                {t("landing.closingCta")}
              </Link>
            ) : (
              <button
                onClick={() => signIn()}
                className="rounded-lg bg-accent px-6 py-3 font-medium text-accent-foreground"
              >
                {t("header.start")}
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
