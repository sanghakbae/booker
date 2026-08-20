"use client";

import { useEffect, useState } from "react";
import { Markdown } from "@/components/Markdown";
import { VARIANTS, VARIANT_CSS, type VariantId } from "./variants";

const DOCS = [
  { file: "02-문서-작성하기", label: "문서 작성하기" },
  { file: "03-초안과-발행", label: "초안과 발행" },
  { file: "04-함께-작업하기", label: "함께 작업하기" },
];

export default function StyleLab() {
  const [variant, setVariant] = useState<VariantId>("current");
  const [doc, setDoc] = useState(DOCS[0].file);
  const [content, setContent] = useState("");

  useEffect(() => {
    fetch(`/_seed/${encodeURIComponent(doc)}.md`)
      .then((r) => r.text())
      .then(setContent)
      .catch(() => setContent("불러오지 못했습니다."));
  }, [doc]);

  return (
    <>
      <style>{VARIANT_CSS}</style>

      <div data-doc-style={variant} className="pb-32">
        <main
          style={{ maxWidth: "var(--container-width)" }}
          className="mx-auto w-full px-4 py-10 md:px-10"
        >
          <Markdown content={content} />
        </main>
      </div>

      {/* Fixed at the bottom so the same scroll position can be compared. */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur">
        <div
          style={{ maxWidth: "var(--container-width)" }}
          className="mx-auto flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted">본문 스타일</span>
            {VARIANTS.map((v) => (
              <button
                key={v.id}
                onClick={() => setVariant(v.id)}
                title={v.summary}
                className={`rounded-md border px-3 py-2 text-sm ${
                  variant === v.id
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border hover:bg-surface"
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted">문서</span>
            {DOCS.map((d) => (
              <button
                key={d.file}
                onClick={() => setDoc(d.file)}
                className={`rounded-md border px-3 py-2 text-sm ${
                  doc === d.file ? "border-accent text-accent" : "border-border hover:bg-surface"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <p className="w-full text-xs text-muted sm:w-auto">
            {VARIANTS.find((v) => v.id === variant)?.summary}
          </p>
        </div>
      </div>
    </>
  );
}
