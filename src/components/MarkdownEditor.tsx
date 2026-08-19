"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { uploadImage } from "@/lib/uploads";
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
import {
  BoldIcon,
  BulletListIcon,
  CalloutIcon,
  CodeBlockIcon,
  CodeIcon,
  CollapseIcon,
  DividerIcon,
  ExpandIcon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  OrderedListIcon,
  QuoteIcon,
  StrikeIcon,
  TableIcon,
  TaskListIcon,
} from "./Icons";
import { Tooltip } from "./Tooltip";

type View = "write" | "split" | "preview";

const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.platform);
const mod = isMac ? "⌘" : "Ctrl";

const MD = "(min-width: 768px)";

/** Two side-by-side panes only make sense when there is width for both. */
function useIsWide() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(MD);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(MD).matches,
    () => true
  );
}

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
  const wide = useIsWide();
  const effectiveView: View = view === "split" && !wide ? "write" : view;
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
          const url = await uploadImage(file, spaceId);
          // The extension is noise in alt text; the name is the useful part.
          const alt = file.name.replace(/\.[^.]+$/, "");
          apply((input) => insertBlock(input, `![${alt}](${url})`));
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

  type Tool = {
    icon: React.ReactNode;
    label: string;
    shortcut?: string;
    run: () => void;
  };

  const groups: Tool[][] = [
    [
      { icon: <span className="text-[13px] font-semibold">H1</span>, label: "제목 1", run: () => apply((i) => setHeading(i, 1)) },
      { icon: <span className="text-[13px] font-semibold">H2</span>, label: "제목 2", run: () => apply((i) => setHeading(i, 2)) },
      { icon: <span className="text-[13px] font-semibold">H3</span>, label: "제목 3", run: () => apply((i) => setHeading(i, 3)) },
    ],
    [
      { icon: <BoldIcon />, label: "굵게", shortcut: `${mod}B`, run: () => apply((i) => toggleWrap(i, "**")) },
      { icon: <ItalicIcon />, label: "기울임", shortcut: `${mod}I`, run: () => apply((i) => toggleWrap(i, "_")) },
      { icon: <StrikeIcon />, label: "취소선", run: () => apply((i) => toggleWrap(i, "~~")) },
      { icon: <CodeIcon />, label: "인라인 코드", run: () => apply((i) => toggleWrap(i, "`")) },
    ],
    [
      { icon: <BulletListIcon />, label: "글머리 목록", run: () => apply((i) => togglePrefix(i, "- ")) },
      { icon: <OrderedListIcon />, label: "번호 목록", run: () => apply(toggleOrderedList) },
      { icon: <TaskListIcon />, label: "체크리스트", run: () => apply((i) => togglePrefix(i, "- [ ] ")) },
      { icon: <QuoteIcon />, label: "인용", run: () => apply((i) => togglePrefix(i, "> ")) },
    ],
    [
      { icon: <LinkIcon />, label: "링크", shortcut: `${mod}K`, run: promptLink },
      { icon: <CodeBlockIcon />, label: "코드 블록", run: () => apply((i) => insertBlock(i, "```\n\n```")) },
      { icon: <TableIcon />, label: "표 삽입", run: () => apply((i) => insertBlock(i, makeTable(2, 3))) },
      { icon: <DividerIcon />, label: "구분선", run: () => apply((i) => insertBlock(i, "---")) },
      {
        icon: <CalloutIcon />,
        label: "안내 상자",
        run: () => apply((i) => insertBlock(i, "> **참고**\n>\n> 내용을 작성하세요.")),
      },
    ],
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
        {groups.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5">
            {gi > 0 && <span className="mx-1.5 h-5 w-px bg-border" aria-hidden />}
            {group.map((tool) => (
              <Tooltip key={tool.label} label={tool.label} shortcut={tool.shortcut}>
                <button
                  type="button"
                  aria-label={tool.label}
                  onClick={tool.run}
                  className="flex h-8 w-8 items-center justify-center rounded text-foreground/80 hover:bg-background hover:text-foreground"
                >
                  {tool.icon}
                </button>
              </Tooltip>
            ))}
          </div>
        ))}

        <span className="mx-1.5 h-5 w-px bg-border" aria-hidden />

        <Tooltip label="이미지 올리기" shortcut="붙여넣기·드래그">
          <label className="flex h-8 w-8 cursor-pointer items-center justify-center rounded text-foreground/80 hover:bg-background hover:text-foreground">
            {uploading ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <ImageIcon />
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              aria-label="이미지 올리기"
              onChange={(e) => e.target.files && upload(e.target.files)}
            />
          </label>
        </Tooltip>

        <div className="ml-auto flex items-center gap-1">
          <div className="flex rounded-md border border-border p-0.5" role="group" aria-label="보기 방식">
            {(["write", "split", "preview"] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={effectiveView === v}
                onClick={() => setView(v)}
                // Split needs two readable columns; below md there is room for one.
                className={`rounded px-2 py-1 text-xs ${v === "split" ? "hidden md:block" : ""} ${
                  effectiveView === v ? "bg-accent text-accent-foreground" : "hover:bg-background"
                }`}
              >
                {v === "write" ? "편집" : v === "split" ? "분할" : "미리보기"}
              </button>
            ))}
          </div>

          <Tooltip label={fullscreen ? "전체 화면 끄기" : "전체 화면"}>
            <button
              type="button"
              aria-label={fullscreen ? "전체 화면 끄기" : "전체 화면"}
              onClick={() => setFullscreen((f) => !f)}
              className="flex h-8 w-8 items-center justify-center rounded text-foreground/80 hover:bg-background hover:text-foreground"
            >
              {fullscreen ? <CollapseIcon /> : <ExpandIcon />}
            </button>
          </Tooltip>

          <button
            type="button"
            onClick={onSave}
            disabled={saving || !dirty}
            className="ml-1 h-8 rounded bg-accent px-3 text-xs font-medium text-accent-foreground disabled:opacity-40"
          >
            {saving ? "저장 중…" : dirty ? `저장 ${mod}S` : "저장됨"}
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {effectiveView !== "preview" && (
          <div
            className={`flex min-h-0 flex-1 justify-center overflow-auto ${
              effectiveView === "split" ? "border-r border-border" : ""
            }`}
          >
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
              // Capped at the reading measure: a full-width line in the editor
              // does not match what the published page will look like.
              style={{ maxWidth: "var(--content-wide)" }}
              className="min-h-0 w-full resize-none bg-background p-6 font-mono text-sm leading-relaxed outline-none"
            />
          </div>
        )}
        {effectiveView !== "write" && (
          <div className="flex min-h-0 flex-1 justify-center overflow-auto">
            <div style={{ maxWidth: "var(--content-wide)" }} className="w-full p-6">
              <Markdown content={value} />
            </div>
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
