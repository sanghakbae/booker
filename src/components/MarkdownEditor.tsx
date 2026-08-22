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
import { useDialogs } from "./DialogProvider";
import { useT } from "./LocaleProvider";
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
  const t = useT();
  const dialogs = useDialogs();
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [view, setView] = useState<View>("split");
  const wide = useIsWide();
  const effectiveView: View = view === "split" && !wide ? "write" : view;
  const [fullscreen, setFullscreen] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
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

  const promptLink = useCallback(async () => {
    const url = await dialogs.prompt(t("editor.linkPrompt"), "https://");
    if (url) apply((input) => insertLink(input, url));
  }, [apply, dialogs, t]);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!images.length) return;
      setProgress({ done: 0, total: images.length });

      // Each file is settled on its own. Aborting the batch on the first
      // failure used to discard the images that had already uploaded, which
      // made a partial failure look like "only one image was inserted".
      const snippets: string[] = [];
      const failed: string[] = [];

      for (const [index, file] of images.entries()) {
        try {
          const url = await uploadImage(file, spaceId);
          // The extension is noise in alt text; the name is the useful part.
          snippets.push(`![${file.name.replace(/\.[^.]+$/, "")}](${url})`);
        } catch {
          failed.push(file.name);
        }
        setProgress({ done: index + 1, total: images.length });
      }

      setProgress(null);

      // One insert for the whole batch: inserting inside the loop reused the
      // editor value captured before the first insert, so each image
      // overwrote the previous one.
      if (snippets.length) apply((input) => insertBlock(input, snippets.join("\n\n")));

      if (failed.length) {
        void dialogs.alert(
          t("editor.uploadPartial", {
            ok: snippets.length,
            failed: failed.length,
            names: failed.join(", "),
          })
        );
      }
    },
    [apply, dialogs, spaceId, t]
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
      void promptLink();
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
      { icon: <span className="text-[13px] font-semibold">H1</span>, label: t("editor.h1"), run: () => apply((i) => setHeading(i, 1)) },
      { icon: <span className="text-[13px] font-semibold">H2</span>, label: t("editor.h2"), run: () => apply((i) => setHeading(i, 2)) },
      { icon: <span className="text-[13px] font-semibold">H3</span>, label: t("editor.h3"), run: () => apply((i) => setHeading(i, 3)) },
    ],
    [
      { icon: <BoldIcon />, label: t("editor.bold"), shortcut: `${mod}B`, run: () => apply((i) => toggleWrap(i, "**")) },
      { icon: <ItalicIcon />, label: t("editor.italic"), shortcut: `${mod}I`, run: () => apply((i) => toggleWrap(i, "_")) },
      { icon: <StrikeIcon />, label: t("editor.strike"), run: () => apply((i) => toggleWrap(i, "~~")) },
      { icon: <CodeIcon />, label: t("editor.inlineCode"), run: () => apply((i) => toggleWrap(i, "`")) },
    ],
    [
      { icon: <BulletListIcon />, label: t("editor.bulletList"), run: () => apply((i) => togglePrefix(i, "- ")) },
      { icon: <OrderedListIcon />, label: t("editor.orderedList"), run: () => apply(toggleOrderedList) },
      { icon: <TaskListIcon />, label: t("editor.taskList"), run: () => apply((i) => togglePrefix(i, "- [ ] ")) },
      { icon: <QuoteIcon />, label: t("editor.quote"), run: () => apply((i) => togglePrefix(i, "> ")) },
    ],
    [
      { icon: <LinkIcon />, label: t("editor.linkLabel"), shortcut: `${mod}K`, run: () => void promptLink() },
      { icon: <CodeBlockIcon />, label: t("editor.codeBlock"), run: () => apply((i) => insertBlock(i, "```\n\n```")) },
      { icon: <TableIcon />, label: t("editor.table"), run: () => apply((i) => insertBlock(i, makeTable(2, 3))) },
      { icon: <DividerIcon />, label: t("editor.divider"), run: () => apply((i) => insertBlock(i, "---")) },
      {
        icon: <CalloutIcon />,
        label: t("editor.callout"),
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

        <Tooltip label={t("editor.uploadImage")} shortcut={t("editor.uploadHint")}>
          <label className="flex h-8 w-8 cursor-pointer items-center justify-center rounded text-foreground/80 hover:bg-background hover:text-foreground">
            {progress ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <ImageIcon />
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              aria-label={t("editor.uploadImage")}
              onChange={(e) => e.target.files && upload(e.target.files)}
            />
          </label>
        </Tooltip>

        <div className="ml-auto flex items-center gap-1">
          <div className="flex rounded-md border border-border p-0.5" role="group" aria-label={t("editor.viewMode")}>
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
                {v === "write"
                  ? t("editor.viewWrite")
                  : v === "split"
                    ? t("editor.viewSplit")
                    : t("editor.viewPreview")}
              </button>
            ))}
          </div>

          <Tooltip label={fullscreen ? t("editor.exitFullscreen") : t("editor.fullscreen")}>
            <button
              type="button"
              aria-label={fullscreen ? t("editor.exitFullscreen") : t("editor.fullscreen")}
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
            {saving ? t("common.saving") : dirty ? `${t("common.save")} ${mod}S` : t("common.saved")}
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
              placeholder={t("editor.placeholder")}
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
        <span>{t("editor.words", { n: counts.words.toLocaleString() })}</span>
        <span>{t("editor.chars", { n: counts.chars.toLocaleString() })}</span>
        <span>{t("editor.readingTime", { n: counts.minutes })}</span>
        {progress && (
          <span className="text-accent">
            {t("editor.uploadingCount", { done: progress.done, total: progress.total })}
          </span>
        )}
        <span className="ml-auto">{dirty ? t("editor.unsaved") : t("editor.allSaved")}</span>
      </div>
    </div>
  );
}
