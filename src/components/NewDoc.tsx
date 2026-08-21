"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSpace } from "@/components/SpaceProvider";
import { EmptyState, Loading } from "./Loading";
import { useT } from "./LocaleProvider";
import { createPage, slugify } from "@/lib/db";

export function NewDoc() {
  const { space, pages, loading, canEdit, refresh } = useSpace();
  const router = useRouter();
  const t = useT();
  const [title, setTitle] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!space) return;
    setBusy(true);
    setError("");
    try {
      const slug = slugify(title);
      await createPage(space.id, { title: title.trim(), slug, parentId });
      await refresh();
      router.push(`/s/${space.slug}/${slug}/edit`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  if (loading) return <Loading label={t("common.loading")} />;
  if (!space) return <EmptyState title={t("reader.spaceNotFound")} />;
  if (!canEdit) return <EmptyState title={t("editor.noPermission")} />;

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-16">
      <h1 className="text-2xl font-bold">{t("newDoc.title")}</h1>
      <form onSubmit={submit} className="mt-8 space-y-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("newDoc.docTitle")}</label>
          <input
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
          />
          <p className="mt-1 text-xs text-muted">
            /s/{space.slug}/{slugify(title || t("newDoc.addressPreview"))}
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("newDoc.location")}</label>
          <select
            value={parentId ?? ""}
            onChange={(e) => setParentId(e.target.value || null)}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
          >
            <option value="">{t("editor.topLevel")}</option>
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {t("editor.childOf", { title: p.title })}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground disabled:opacity-40"
        >
          {busy ? t("common.creating") : t("common.create")}
        </button>
      </form>
    </main>
  );
}
