"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { flattenTree } from "@/lib/db";
import { EmptyState, Loading } from "./Loading";
import { Markdown } from "./Markdown";
import { useSpace } from "./SpaceProvider";

/**
 * The whole manual on one page, laid out for print. Browsers' "save as PDF"
 * does the export, which keeps selectable text and needs no PDF library.
 */
export function PrintView() {
  const { space, tree, loading } = useSpace();
  const documents = useMemo(() => flattenTree(tree), [tree]);

  // Give the content a moment to render before the print dialog measures it.
  useEffect(() => {
    if (loading || !space || documents.length === 0) return;
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, [loading, space, documents.length]);

  if (loading) return <Loading />;
  if (!space) return <EmptyState title="매뉴얼을 찾을 수 없습니다" />;

  return (
    <main className="mx-auto w-full px-6 py-10 print:px-0 print:py-0" style={{ maxWidth: "var(--content-wide)" }}>
      <div className="mb-10 flex items-center justify-between gap-4 print:hidden">
        <p className="text-sm text-muted">
          인쇄 창이 열립니다. 대상에서 &ldquo;PDF로 저장&rdquo;을 선택하세요.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
          >
            다시 인쇄
          </button>
          <Link
            href={`/s/${space.slug}`}
            className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface"
          >
            돌아가기
          </Link>
        </div>
      </div>

      <header className="mb-12 border-b border-border pb-8">
        <h1 className="text-4xl font-bold">{space.title}</h1>
        {space.description && <p className="mt-3 text-muted">{space.description}</p>}
        <p className="mt-4 text-sm text-muted">
          booker.sanghak.kr/s/{space.slug} · {new Date().toLocaleDateString("ko-KR")} 기준
        </p>
      </header>

      {documents.length === 0 ? (
        <EmptyState title="발행된 문서가 없습니다" />
      ) : (
        <>
          <nav className="mb-12 print:break-after-page">
            <h2 className="mb-3 text-lg font-semibold">목차</h2>
            <ol className="space-y-1 text-sm">
              {documents.map((doc, i) => (
                <li key={doc.id}>
                  {i + 1}. {doc.title}
                </li>
              ))}
            </ol>
          </nav>

          {documents.map((doc) => (
            <section key={doc.id} className="mb-16 print:break-before-page">
              <Markdown content={doc.content} />
            </section>
          ))}
        </>
      )}
    </main>
  );
}
