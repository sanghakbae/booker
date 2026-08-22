"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Loading } from "@/components/Loading";
import { useT } from "@/components/LocaleProvider";
import { createPage, createSpace, slugify } from "@/lib/db";
import { hasHangul } from "@/lib/romanize";
import { TEMPLATES } from "@/lib/templates";

export default function NewSpacePage() {
  const { user, loading, signIn } = useAuth();
  const router = useRouter();
  const t = useT();

  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState("product");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  // Private by default. A manual usually starts as a draft and often carries
  // internal material, and the visibility control sits behind a collapsed
  // section — so publishing has to be a deliberate act, not an oversight.
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [showOptions, setShowOptions] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Everything except the name has a sensible default, so one field is enough.
  const effectiveSlug = slugify(slug || title);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError("");
    try {
      const spaceId = await createSpace({
        title: title.trim(),
        slug: effectiveSlug,
        description: description.trim(),
        ownerId: user.uid,
        visibility,
      });

      const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];
      // Sequential, because each page's order depends on the ones before it.
      for (const page of template.pages) {
        await createPage(spaceId, {
          title: page.title,
          slug: slugify(page.title),
          content: page.content,
        });
      }

      router.push(`/s/${effectiveSlug}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  if (loading) return <Loading label={t("common.loading")} />;

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-24 text-center">
        <p className="text-muted">{t("new.signInPrompt")}</p>
        <button
          onClick={() => signIn()}
          className="mt-4 rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground"
        >
          {t("common.signIn")}
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">{t("new.title")}</h1>
      <p className="mt-2 text-muted">{t("new.subtitle")}</p>

      <form onSubmit={submit} className="mt-10 space-y-8">
        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("new.name")}</label>
          <input
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("new.namePlaceholder")}
            className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-lg"
          />
          {title && (
            <>
              <p className="mt-1.5 text-xs text-muted">
                booker.sanghak.kr/s/{effectiveSlug}
              </p>
              {hasHangul(slug || title) && (
                <p className="mt-1 text-xs text-muted">{t("new.romanizedHint")}</p>
              )}
            </>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">{t("new.template")}</label>
          <div className="grid gap-2 sm:grid-cols-2">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setTemplateId(template.id)}
                className={`rounded-lg border p-3 text-left ${
                  templateId === template.id
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-accent/50"
                }`}
              >
                <p className="text-sm font-medium">{template.name}</p>
                <p className="mt-0.5 text-xs text-muted">{template.summary}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowOptions((v) => !v)}
            className="text-sm text-muted hover:text-foreground"
          >
            {showOptions ? t("new.hideOptions") : t("new.showOptions")}
          </button>

          {showOptions && (
            <div className="mt-4 space-y-5 rounded-lg border border-border p-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t("new.slug")}</label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder={slugify(title) || "admin-guide"}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">{t("new.description")}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">{t("new.visibility")}</label>
                <div className="flex flex-wrap gap-4 text-sm">
                  {(["public", "private"] as const).map((v) => (
                    <label key={v} className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={visibility === v}
                        onChange={() => setVisibility(v)}
                      />
                      {v === "public" ? t("new.publicLabel") : t("new.privateLabel")}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="rounded-md bg-accent px-5 py-2.5 font-medium text-accent-foreground disabled:opacity-40"
        >
          {busy ? t("common.creating") : t("common.create")}
        </button>
      </form>
    </main>
  );
}
