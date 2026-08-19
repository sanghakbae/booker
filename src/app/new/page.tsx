"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createPage, createSpace, slugify } from "@/lib/db";

export default function NewSpacePage() {
  const { user, loading, signIn } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const effectiveSlug = slug || slugify(title);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError("");
    try {
      const spaceId = await createSpace({
        title: title.trim(),
        slug: slugify(effectiveSlug),
        description: description.trim(),
        ownerId: user.uid,
        visibility,
      });
      await createPage(spaceId, {
        title: "시작하기",
        slug: "시작하기",
        content: `# 시작하기\n\n${title.trim()} 매뉴얼에 오신 것을 환영합니다.\n`,
      });
      router.push(`/s/${slugify(effectiveSlug)}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  if (loading) return <main className="p-16 text-muted">불러오는 중…</main>;

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-24 text-center">
        <p className="text-muted">매뉴얼을 만들려면 로그인이 필요합니다.</p>
        <button
          onClick={() => signIn()}
          className="mt-4 rounded-md bg-accent px-4 py-2 font-medium text-white"
        >
          Google로 로그인
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-16">
      <h1 className="text-2xl font-bold">새 매뉴얼</h1>
      <form onSubmit={submit} className="mt-8 space-y-6">
        <Field label="이름">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 관리자 매뉴얼"
            className="w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </Field>

        <Field label="주소" hint={`booker.sanghak.kr/s/${slugify(effectiveSlug || "주소")}`}>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={slugify(title) || "admin-guide"}
            className="w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </Field>

        <Field label="설명">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </Field>

        <Field label="공개 범위">
          <div className="flex gap-4 text-sm">
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
        </Field>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="rounded-md bg-accent px-4 py-2 font-medium text-white disabled:opacity-40"
        >
          {busy ? "만드는 중…" : "만들기"}
        </button>
      </form>
    </main>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
