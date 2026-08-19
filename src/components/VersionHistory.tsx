"use client";

import { useEffect, useState } from "react";
import { listVersions } from "@/lib/db";
import type { Version } from "@/lib/types";
import { CloseIcon } from "./Icons";
import { Markdown } from "./Markdown";

function when(v: Version) {
  const date = v.publishedAt?.toDate?.();
  return date
    ? date.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" })
    : "방금";
}

/** Past publishes of one document, with restore-into-draft. */
export function VersionHistory({
  spaceId,
  pageId,
  onRestore,
  onClose,
}: {
  spaceId: string;
  pageId: string;
  onRestore: (version: Version) => void;
  onClose: () => void;
}) {
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [selected, setSelected] = useState<Version | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    listVersions(spaceId, pageId)
      .then((list) => {
        setVersions(list);
        setSelected(list[0] ?? null);
      })
      .catch((err: Error) => {
        setVersions([]);
        setError(err.message);
      });
  }, [spaceId, pageId]);

  return (
    <div className="fixed inset-0 z-50 flex">
      <button aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-black/40" />

      <div className="relative ml-auto flex h-full w-full max-w-4xl flex-col border-l border-border bg-background">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <h2 className="font-semibold">발행 이력</h2>
          <button
            onClick={onClose}
            aria-label="발행 이력 닫기"
            className="flex h-11 w-11 items-center justify-center rounded-md hover:bg-surface"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          <ul className="w-64 shrink-0 overflow-y-auto border-r border-border p-2">
            {versions === null && <li className="p-3 text-sm text-muted">불러오는 중…</li>}
            {versions?.length === 0 && (
              <li className="p-3 text-sm text-muted">
                {error || "아직 발행한 적이 없습니다."}
              </li>
            )}
            {versions?.map((v) => (
              <li key={v.id}>
                <button
                  onClick={() => setSelected(v)}
                  className={`block w-full rounded-md px-3 py-2.5 text-left ${
                    selected?.id === v.id ? "bg-accent/10 text-accent" : "hover:bg-surface"
                  }`}
                >
                  <span className="block text-sm font-medium">{when(v)}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted">
                    {v.title} · {v.authorEmail}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            {selected ? (
              <>
                <div className="mb-4 flex items-center justify-between gap-4">
                  <p className="text-sm text-muted">{when(selected)} 발행본</p>
                  <button
                    onClick={() => onRestore(selected)}
                    className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
                  >
                    이 버전으로 되돌리기
                  </button>
                </div>
                <Markdown content={selected.content} />
              </>
            ) : (
              <p className="text-sm text-muted">왼쪽에서 버전을 선택하세요.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
