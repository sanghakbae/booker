"use client";

import { useState } from "react";
import { submitFeedback } from "@/lib/db";

/** "Was this helpful?" at the foot of a published document. */
export function PageFeedback({
  spaceId,
  pageId,
  pageSlug,
}: {
  spaceId: string;
  pageId: string;
  pageSlug: string;
}) {
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const send = async (value: boolean, text: string) => {
    setBusy(true);
    try {
      await submitFeedback(spaceId, { pageId, pageSlug, helpful: value, comment: text.trim() });
      setSent(true);
    } catch {
      // A failed vote is not worth interrupting a reader over.
      setSent(true);
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="doc-aligned mt-12 rounded-lg bg-surface p-5">
        <p className="text-sm">의견 고맙습니다.</p>
      </div>
    );
  }

  return (
    <div className="doc-aligned mt-12 rounded-lg bg-surface p-5">
      <p className="text-sm font-medium">이 문서가 도움이 되었나요?</p>

      <div className="mt-3 flex gap-2">
        {[
          { value: true, label: "도움이 되었어요" },
          { value: false, label: "아쉬웠어요" },
        ].map((option) => (
          <button
            key={option.label}
            onClick={() => {
              setHelpful(option.value);
              // A positive vote needs no explanation; send it right away.
              if (option.value) void send(true, "");
            }}
            disabled={busy}
            aria-pressed={helpful === option.value}
            className={`rounded-md border px-3 py-2 text-sm ${
              helpful === option.value ? "border-accent text-accent" : "border-border hover:bg-background"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {helpful === false && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(false, comment);
          }}
          className="mt-3"
        >
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="어떤 점이 부족했는지 알려주시면 고치겠습니다. (선택)"
            aria-label="피드백 내용"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="mt-2 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-40"
          >
            보내기
          </button>
        </form>
      )}
    </div>
  );
}
