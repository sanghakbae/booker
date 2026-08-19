"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPage, slugify } from "@/lib/db";
import { useSpace } from "./SpaceProvider";

/** Creates a document straight from the sidebar — type a title, press Enter. */
export function NewPageButton() {
  const { space, pages, refresh } = useSpace();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const create = async (e: React.FormEvent) => {
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
        + 새 문서
      </button>
    );
  }

  return (
    <form onSubmit={create} className="mt-4 px-1">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        onBlur={() => !title.trim() && setOpen(false)}
        placeholder="문서 제목"
        disabled={busy}
        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </form>
  );
}
