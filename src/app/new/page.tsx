"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Loading } from "@/components/Loading";
import { createPage, createSpace, slugify } from "@/lib/db";
import { TEMPLATES } from "@/lib/templates";

export default function NewSpacePage() {
  const { user, loading, signIn } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState("product");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
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

  if (loading) return <Loading />;

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-24 text-center">
        <p className="text-muted">매뉴얼을 만들려면 로그인이 필요합니다.</p>
        <button
          onClick={() => signIn()}
          className="mt-4 rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground"
        >
          Google로 로그인
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">새 매뉴얼</h1>
      <p className="mt-2 text-muted">이름만 정하면 나머지는 나중에 바꿀 수 있습니다.</p>

      <form onSubmit={submit} className="mt-10 space-y-8">
        <div>
          <label className="mb-1.5 block text-sm font-medium">이름</label>
          <input
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 관리자 매뉴얼"
            className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-lg"
          />
          {title && (
            <p className="mt-1.5 text-xs text-muted">
              booker.sanghak.kr/s/{effectiveSlug}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">시작 구성</label>
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
            {showOptions ? "− 세부 설정 접기" : "+ 주소 · 설명 · 공개 범위 바꾸기"}
          </button>

          {showOptions && (
            <div className="mt-4 space-y-5 rounded-lg border border-border p-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">주소</label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder={slugify(title) || "admin-guide"}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">설명</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">공개 범위</label>
                <div className="flex flex-wrap gap-4 text-sm">
                  {(["public", "private"] as const).map((v) => (
                    <label key={v} className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={visibility === v}
                        onChange={() => setVisibility(v)}
                      />
                      {v === "public" ? "공개 — 누구나 읽을 수 있음" : "비공개 — 나만 볼 수 있음"}
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
          {busy ? "만드는 중…" : "만들기"}
        </button>
      </form>
    </main>
  );
}
