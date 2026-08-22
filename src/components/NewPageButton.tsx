"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPage, slugify } from "@/lib/db";
import { useT } from "./LocaleProvider";
import { useSpace } from "./SpaceProvider";

/** Creates a document straight from the sidebar — type a title, press Enter. */
export function NewPageButton() {
  const { space, pages, refresh } = useSpace();
  const router = useRouter();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const create = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!space || !title.trim() || busy) return;
    setBusy(true);
    setError("");

    // Duplicate titles are common in manuals; give the slug a suffix instead of failing.
    const base = slugify(title);
    const taken = new Set(pages.map((p) => p.slug));
    let slug = base;
    for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;

    try {
      await createPage(space.id, { title: title.trim(), slug });
      await refresh();
      setTitle("");
      setOpen(false);
      router.push(`/s/${space.slug}/${slug}/edit`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-4 block w-full rounded-md px-3 py-1.5 text-left text-sm text-muted hover:bg-surface hover:text-foreground"
      >
        {t("sidebar.newDoc")}
      </button>
    );
  }

  return (
    <form onSubmit={create} className="mt-4 px-1">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            return;
          }
          // A Korean IME sends Enter to commit the composition first; treating
          // that as submit would create a document from a half-typed title.
          if (e.nativeEvent.isComposing) return;
          // Identified three ways: some environments deliver only one of them.
          if (e.key !== "Enter" && e.code !== "Enter" && e.keyCode !== 13) return;

          // Route through the form's own submit path rather than calling the
          // handler directly, so Enter and the button share one code path.
          e.preventDefault();
          e.currentTarget.form?.requestSubmit();
        }}
        placeholder={t("sidebar.docTitlePlaceholder")}
        disabled={busy}
        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {/* A visible action, so creating never depends on knowing to press Enter. */}
      <div className="mt-2 flex gap-2">
        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground disabled:opacity-40"
        >
          {busy ? t("common.creating") : t("common.create")}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-surface"
        >
          {t("common.close")}
        </button>
      </div>
    </form>
  );
}
