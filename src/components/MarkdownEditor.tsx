"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";
import {
  continueList,
  indent,
  insertBlock,
  insertLink,
  makeTable,
  setHeading,
  stats,
  toggleOrderedList,
  togglePrefix,
  toggleWrap,
  type Edit,
} from "@/lib/editor";
import { Markdown } from "./Markdown";

type View = "write" | "split" | "preview";

const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.platform);
const mod = isMac ? "⌘" : "Ctrl";

export function MarkdownEditor({
  value,
  onChange,
  onSave,
  saving,
  dirty,
  spaceId,
}: {
  value: string;
  onChange: (next: string) => void;
  onSave: () => void;
  saving: boolean;
  dirty: boolean;
  spaceId: string;
}) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [view, setView] = useState<View>("split");
  const [fullscreen, setFullscreen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const pending = useRef<{ start: number; end: number } | null>(null);

  const counts = useMemo(() => stats(value), [value]);

  // Toolbar edits change the value and the caret together; the caret can only be
  // restored after React has re-rendered the new value.
  useEffect(() => {
    const area = areaRef.current;
    if (!area || !pending.current) return;
    area.focus();
    area.setSelectionRange(pending.current.start, pending.current.end);
    pending.current = null;
  }, [value]);

  const apply = useCallback(
    (fn: (input: { value: string; start: number; end: number }) => Edit | null) => {
      const area = areaRef.current;
      if (!area) return;
      const result = fn({ value, start: area.selectionStart, end: area.selectionEnd });
      if (!result) return;
      pending.current = { start: result.start, end: result.end };
      onChange(result.value);
    },
    [value, onChange]
  );

  const promptLink = useCallback(() => {
    const url = window.prompt("링크 주소를 입력하세요", "https://");
    if (url) apply((input) => insertLink(input, url));
  }, [apply]);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!images.length) return;
      setUploading(true);
      try {
        for (const file of images) {
          const safe = file.name.replace(/[^\w.-]+/g, "_");
          const path = `spaces/${spaceId}/${Date.now()}-${safe}`;
          const snap = await uploadBytes(storageRef(storage, path), file);
          const url = await getDownloadURL(snap.ref);
          apply((input) => insertBlock(input, `![${file.name}](${url})`));
        }
      } catch (err) {
        window.alert(`이미지 업로드에 실패했습니다: ${(err as Error).message}`);
      } finally {
        setUploading(false);
      }
    },
    [apply, spaceId]
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const meta = e.metaKey || e.ctrlKey;
    if (meta && e.key.toLowerCase() === "s") {
      e.preventDefault();
      onSave();
      return;
    }
    if (meta && e.key.toLowerCase() === "b") {
      e.preventDefault();
      apply((i) => toggleWrap(i, "**"));
      return;
    }
    if (meta && e.key.toLowerCase() === "i") {
      e.preventDefault();
      apply((i) => toggleWrap(i, "_"));
      return;
    }
    if (meta && e.key.toLowerCase() === "k") {
      e.preventDefault();
      promptLink();
      return;
    }
    if (meta && e.key === "Enter") {
      e.preventDefault();
      setView((v) => (v === "preview" ? "write" : "preview"));
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      apply((i) => indent(i, e.shiftKey));
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && !meta) {
      const area = areaRef.current;
      if (!area || area.selectionStart !== area.selectionEnd) return;
      const result = continueList({ value, start: area.selectionStart, end: area.selectionEnd });
      if (result) {
        e.preventDefault();
        pending.current = { start: result.start, end: result.end };
        onChange(result.value);
      }
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.clipboardData.files);
    if (files.some((f) => f.type.startsWith("image/"))) {
      e.preventDefault();
      void upload(files);
      return;
    }
    // Pasting a URL over selected text turns it into a markdown link.
    const text = e.clipboardData.getData("text/plain");
    const area = areaRef.current;
    if (area && /^https?:\/\/\S+$/.test(text.trim()) && area.selectionStart !== area.selectionEnd) {
      e.preventDefault();
      apply((i) => insertLink(i, text.trim()));
    }
  };

  const tools: Array<{ label: string; title: string; run: () => void } | "|"> = [
    { label: "H1", title: "제목 1", run: () => apply((i) => setHeading(i, 1)) },
    { label: "H2", title: "제목 2", run: () => apply((i) => setHeading(i, 2)) },
    { label: "H3", title: "제목 3", run: () => apply((i) => setHeading(i, 3)) },
    "|",
    { label: "B", title: `굵게 (${mod}B)`, run: () => apply((i) => toggleWrap(i, "**")) },
    { label: "I", title: `기울임 (${mod}I)`, run: () => apply((i) => toggleWrap(i, "_")) },
    { label: "S", title: "취소선", run: () => apply((i) => toggleWrap(i, "~~")) },
    { label: "</>", title: "인라인 코드", run: () => apply((i) => toggleWrap(i, "`")) },
    "|",
    { label: "•", title: "글머리 목록", run: () => apply((i) => togglePrefix(i, "- ")) },
    { label: "1.", title: "번호 목록", run: () => apply(toggleOrderedList) },
    { label: "☑", title: "체크리스트", run: () => apply((i) => togglePrefix(i, "- [ ] ")) },
    { label: "❝", title: "인용", run: () => apply((i) => togglePrefix(i, "> ")) },
    "|",
    { label: "🔗", title: `링크 (${mod}K)`, run: promptLink },
    {
      label: "{ }",
      title: "코드 블록",
      run: () => apply((i) => insertBlock(i, "```\n\n```")),
    },
    { label: "▦", title: "표 삽입", run: () => apply((i) => insertBlock(i, makeTable(2, 3))) },
    { label: "—", title: "구분선", run: () => apply((i) => insertBlock(i, "---")) },
    {
      label: "ℹ",
      title: "안내 상자",
      run: () => apply((i) => insertBlock(i, "> **참고**\n>\n> 내용을 작성하세요.")),
    },
  ];

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-50 flex flex-col bg-background"
          : "flex min-h-0 flex-1 flex-col"
      }
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-surface px-3 py-2">
        {/* Each tool's `run` reads the textarea ref, but only when clicked —
            the lint rule cannot see that the read is deferred. */}
        {/* eslint-disable-next-line react-hooks/refs */}
        {tools.map((tool, i) =>
          tool === "|" ? (
            <span key={i} className="mx-1 h-5 w-px bg-border" />
          ) : (
            <button
              key={tool.title}
              type="button"
              title={tool.title}
              onClick={tool.run}
              className="min-w-8 rounded px-2 py-1 text-sm hover:bg-background"
            >
              {tool.label}
            </button>
          )
        )}

        <label
          className="min-w-8 cursor-pointer rounded px-2 py-1 text-sm hover:bg-background"
          title="이미지 업로드 (붙여넣기·드래그도 가능)"
        >
          {uploading ? "…" : "🖼"}
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => e.target.files && upload(e.target.files)}
          />
        </label>

        <div className="ml-auto flex items-center gap-1">
          {(["write", "split", "preview"] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded px-2 py-1 text-xs ${
                view === v ? "bg-accent text-white" : "hover:bg-background"
              }`}
            >
              {v === "write" ? "편집" : v === "split" ? "분할" : "미리보기"}
            </button>
          ))}
          <button
            type="button"
            title="전체 화면"
            onClick={() => setFullscreen((f) => !f)}
            className="rounded px-2 py-1 text-sm hover:bg-background"
          >
            {fullscreen ? "⤡" : "⤢"}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !dirty}
            className="ml-1 rounded bg-accent px-3 py-1 text-xs font-medium text-white disabled:opacity-40"
          >
            {saving ? "저장 중…" : dirty ? `저장 (${mod}S)` : "저장됨"}
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {view !== "preview" && (
          <textarea
            ref={areaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onDrop={(e) => {
              if (e.dataTransfer.files.length) {
                e.preventDefault();
                void upload(e.dataTransfer.files);
              }
            }}
            spellCheck={false}
            placeholder="마크다운으로 작성하세요. 이미지는 붙여넣거나 끌어다 놓으면 업로드됩니다."
            className={`min-h-0 flex-1 resize-none bg-background p-6 font-mono text-sm leading-relaxed outline-none ${
              view === "split" ? "border-r border-border" : ""
            }`}
          />
        )}
        {view !== "write" && (
          <div className="min-h-0 flex-1 overflow-auto p-6">
            <Markdown content={value} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 border-t border-border bg-surface px-4 py-1.5 text-xs text-muted">
        <span>{counts.words.toLocaleString()} 단어</span>
        <span>{counts.chars.toLocaleString()} 자</span>
        <span>읽는 데 약 {counts.minutes}분</span>
        <span className="ml-auto">{dirty ? "저장되지 않은 변경사항" : "모든 변경사항 저장됨"}</span>
      </div>
    </div>
  );
}
