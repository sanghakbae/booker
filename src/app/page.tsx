"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Wordmark } from "@/components/Wordmark";

const FEATURES = [
  {
    title: "쓰면 바로 문서 사이트",
    body: "마크다운으로 쓰면 목차와 검색, 이전·다음 이동이 자동으로 붙습니다. 읽는 사람은 로그인할 필요가 없습니다.",
  },
  {
    title: "초안과 발행을 분리",
    body: "쓰던 글은 초안에만 저장됩니다. 발행을 누른 순간의 내용만 공개되니, 편집 중인 문장이 새어 나가지 않습니다.",
  },
  {
    title: "되돌릴 수 있는 이력",
    body: "발행할 때마다 그 시점의 내용이 기록됩니다. 언제 누가 무엇을 바꿨는지 보고, 과거 버전으로 되돌릴 수 있습니다.",
  },
  {
    title: "함께 쓰기",
    body: "이메일로 편집자를 초대합니다. 초대받은 사람이 booker를 처음 쓰는 경우에도, 로그인하는 순간부터 편집할 수 있습니다.",
  },
  {
    title: "이미지는 붙여넣기",
    body: "스크린샷을 그대로 붙여넣거나 끌어다 놓으면 업로드됩니다. 파일을 따로 관리할 일이 없습니다.",
  },
  {
    title: "인쇄와 PDF",
    body: "매뉴얼 전체를 목차와 함께 한 문서로 펼쳐 인쇄하거나 PDF로 저장합니다. 배포용 문서를 따로 만들지 않아도 됩니다.",
  },
];

const STEPS = [
  { n: "1", title: "매뉴얼 만들기", body: "이름만 정하면 됩니다. 주소와 공개 범위는 나중에 바꿀 수 있습니다." },
  { n: "2", title: "템플릿에서 시작", body: "사용 설명서·업무 매뉴얼·API 문서 골격 중에 고릅니다." },
  { n: "3", title: "쓰고 발행", body: "다 됐으면 발행합니다. 공개할지 말지는 매뉴얼마다 따로 정합니다." },
];

export default function LandingPage() {
  const { user, loading, signIn } = useAuth();

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
            매뉴얼을 쓰고,
            <br />
            공개하세요
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-muted">
            마크다운으로 쓰면 목차와 검색이 있는 문서 사이트가 됩니다.{" "}
            <span className="nowrap">읽는 데 로그인은 필요 없습니다.</span>
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            {loading ? null : user ? (
              <Link
                href="/manuals"
                className="rounded-lg bg-accent px-5 py-3 font-medium text-accent-foreground shadow-[0_6px_20px_var(--brand-glow)]"
              >
                내 매뉴얼로 가기
              </Link>
            ) : (
              <button
                onClick={() => signIn()}
                className="rounded-lg bg-accent px-5 py-3 font-medium text-accent-foreground shadow-[0_6px_20px_var(--brand-glow)]"
              >
                Google로 시작하기
              </button>
            )}

            <Link
              href="/s/guide/시작하기"
              className="rounded-lg border border-border px-5 py-3 font-medium hover:bg-surface"
            >
              사용 설명서 보기
            </Link>
          </div>

          <p className="mt-5 text-sm text-muted">
            무료 · 설치 없음 · 이 설명서도 booker로 만들었습니다
          </p>
        </div>
      </section>

      {/* ---- features ---- */}
      <section className="border-t border-border">
        <div
          style={{ maxWidth: "var(--container-width)" }}
          className="mx-auto w-full px-4 py-10"
        >
          <h2 className="flex items-center gap-3 text-[1.75rem] font-semibold tracking-tight text-muted">
            <span className="h-6 w-1.5 rounded-full bg-accent" aria-hidden />
            무엇이 들어 있나
          </h2>

          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="rounded-xl border border-border p-6">
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{feature.body}</p>
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
          <h2 className="flex items-center gap-3 text-[1.75rem] font-semibold tracking-tight text-muted">
            <span className="h-6 w-1.5 rounded-full bg-accent" aria-hidden />
            시작하는 순서
          </h2>

          <ol className="mt-8 grid gap-5 sm:grid-cols-3">
            {STEPS.map((step) => (
              <li key={step.n} className="rounded-xl border border-border bg-background p-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                  {step.n}
                </span>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
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
            첫 매뉴얼은 5분이면 만듭니다
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            이름 하나만 정하면 시작할 수 있습니다. 공개할지 말지는 매뉴얼마다 따로 고르세요.
          </p>

          <div className="mt-8 flex justify-center">
            {loading ? null : user ? (
              <Link
                href="/new"
                className="rounded-lg bg-accent px-6 py-3 font-medium text-accent-foreground"
              >
                새 매뉴얼 만들기
              </Link>
            ) : (
              <button
                onClick={() => signIn()}
                className="rounded-lg bg-accent px-6 py-3 font-medium text-accent-foreground"
              >
                Google로 시작하기
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
