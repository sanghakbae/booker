"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  deleteFeedback,
  deleteSpace,
  listFeedback,
  moveSpace,
  slugify,
  updateSpace,
} from "@/lib/db";
import type { Feedback } from "@/lib/types";
import { EmptyState, Loading } from "./Loading";
import { MobileNav } from "./MobileNav";
import { PageOrderEditor } from "./PageOrderEditor";
import { Sidebar } from "./Sidebar";
import { useSpace } from "./SpaceProvider";

type Tab = "general" | "order" | "editors" | "feedback" | "danger";

const TABS: Array<{ id: Tab; label: string; ownerOnly?: boolean }> = [
  { id: "general", label: "기본 정보" },
  { id: "order", label: "문서 순서" },
  { id: "editors", label: "편집자", ownerOnly: true },
  { id: "feedback", label: "피드백" },
  { id: "danger", label: "매뉴얼 삭제", ownerOnly: true },
];

export function SpaceSettings() {
  const { space, loading, canEdit, isOwner, refresh } = useSpace();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("general");

  if (loading) return <Loading />;
  if (!space) return <EmptyState title="매뉴얼을 찾을 수 없습니다" />;
  if (!canEdit) return <EmptyState title="설정을 볼 권한이 없습니다" />;

  const visible = TABS.filter((t) => !t.ownerOnly || isOwner);

  return (
    <>
      <MobileNav currentTitle="설정" />

      <div
        style={{ maxWidth: "var(--container-width)" }}
        className="mx-auto flex w-full flex-1 px-4"
      >
        <Sidebar />

        <main className="min-w-0 flex-1 py-10 md:px-10">
          <h1 className="text-2xl font-bold">{space.title} 설정</h1>

          {/* Wrapping rather than scrolling: a horizontally scrolled strip just
              looked like the last tab had been cut off. */}
          <div className="mt-6 flex flex-wrap gap-x-1 border-b border-border" role="tablist">
            {visible.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`border-b-2 px-3 py-2.5 text-sm ${
                  tab === t.id
                    ? "border-accent font-medium text-accent"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="py-8" style={{ maxWidth: "var(--content-width)" }}>
            {tab === "general" && <GeneralTab onSaved={refresh} />}
            {tab === "order" && <PageOrderEditor />}
            {tab === "editors" && <EditorsTab onSaved={refresh} />}
            {tab === "feedback" && <FeedbackTab />}
            {tab === "danger" && (
              <DangerTab
                onDeleted={() => {
                  router.push("/");
                }}
              />
            )}
          </div>
        </main>
      </div>
    </>
  );
}

function GeneralTab({ onSaved }: { onSaved: () => Promise<void> }) {
  const { space } = useSpace();
  const router = useRouter();
  const [title, setTitle] = useState(space?.title ?? "");
  const [description, setDescription] = useState(space?.description ?? "");
  const [visibility, setVisibility] = useState(space?.visibility ?? "public");
  const [slug, setSlug] = useState(space?.slug ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!space) return null;
  const nextSlug = slugify(slug);
  const slugChanged = nextSlug !== space.slug;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await updateSpace(space.id, { title: title.trim(), description: description.trim(), visibility });

      if (slugChanged) {
        // The document ID is the slug, so this rewrites every document.
        const ok = window.confirm(
          `주소를 /${space.slug} 에서 /${nextSlug} 로 바꾸면 기존 링크는 더 이상 열리지 않습니다. 계속할까요?`
        );
        if (!ok) {
          setBusy(false);
          return;
        }
        await moveSpace({ ...space, title: title.trim(), description: description.trim(), visibility }, nextSlug);
        router.replace(`/s/${nextSlug}/settings`);
        return;
      }

      await onSaved();
      setMessage("저장했습니다.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Field label="이름">
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
        />
      </Field>

      <Field
        label="주소"
        hint={
          slugChanged
            ? `바뀝니다: /s/${space.slug} → /s/${nextSlug} · 기존 링크는 끊깁니다`
            : `booker.sanghak.kr/s/${space.slug}`
        }
      >
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
        />
      </Field>

      <Field label="설명">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
        />
      </Field>

      <Field label="공개 범위">
        <div className="flex flex-wrap gap-4 text-sm">
          {(["public", "private"] as const).map((v) => (
            <label key={v} className="flex items-center gap-2">
              <input type="radio" checked={visibility === v} onChange={() => setVisibility(v)} />
              {v === "public" ? "공개 — 누구나 읽을 수 있음" : "비공개 — 편집자만 볼 수 있음"}
            </label>
          ))}
        </div>
      </Field>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {message && <p className="text-sm text-emerald-600">{message}</p>}

      <button
        type="submit"
        disabled={busy || !title.trim()}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-40"
      >
        {busy ? "저장 중…" : "저장"}
      </button>
    </form>
  );
}

function EditorsTab({ onSaved }: { onSaved: () => Promise<void> }) {
  const { space } = useSpace();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!space) return null;
  const editors = space.editorEmails ?? [];

  const change = async (next: string[]) => {
    setBusy(true);
    setError("");
    try {
      await updateSpace(space.id, { editorEmails: next });
      await onSaved();
      setEmail("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!value) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setError("올바른 이메일 주소가 아닙니다.");
      return;
    }
    if (editors.includes(value)) {
      setError("이미 초대된 사람입니다.");
      return;
    }
    await change([...editors, value]);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        초대한 이메일로 Google 로그인하면 이 매뉴얼의 문서를 편집할 수 있습니다. 매뉴얼 설정과
        삭제는 소유자만 할 수 있습니다.
      </p>

      <form onSubmit={add} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="editor@example.com"
          aria-label="초대할 이메일"
          className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2"
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-40"
        >
          초대
        </button>
      </form>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <ul className="divide-y divide-border rounded-lg border border-border">
        <li className="flex items-center justify-between px-4 py-3">
          <span className="text-sm">{space.ownerId ? "소유자" : ""}</span>
          <span className="text-xs text-muted">모든 권한</span>
        </li>
        {editors.map((address) => (
          <li key={address} className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="min-w-0 truncate text-sm">{address}</span>
            <button
              onClick={() => change(editors.filter((e) => e !== address))}
              disabled={busy}
              className="shrink-0 text-sm text-red-500 hover:underline"
            >
              제거
            </button>
          </li>
        ))}
        {editors.length === 0 && (
          <li className="px-4 py-3 text-sm text-muted">아직 초대한 편집자가 없습니다.</li>
        )}
      </ul>
    </div>
  );
}

function FeedbackTab() {
  const { space } = useSpace();
  const [items, setItems] = useState<Feedback[] | null>(null);

  useEffect(() => {
    if (!space) return;
    listFeedback(space.id)
      .then(setItems)
      .catch(() => setItems([]));
  }, [space]);

  if (!space) return null;
  if (items === null) return <p className="text-sm text-muted">불러오는 중…</p>;
  if (items.length === 0) {
    return <p className="text-sm text-muted">아직 받은 피드백이 없습니다.</p>;
  }

  const helpful = items.filter((i) => i.helpful).length;

  const remove = async (id: string) => {
    await deleteFeedback(space.id, id);
    setItems((prev) => prev?.filter((i) => i.id !== id) ?? null);
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        전체 {items.length}건 중 도움이 되었다는 응답 {helpful}건 (
        {Math.round((helpful / items.length) * 100)}%)
      </p>

      <ul className="divide-y divide-border rounded-lg border border-border">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 px-4 py-3">
            <span className="shrink-0 text-lg" aria-hidden>
              {item.helpful ? "👍" : "👎"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{item.pageSlug}</p>
              {item.comment && <p className="mt-1 text-sm text-muted">{item.comment}</p>}
              <p className="mt-1 text-xs text-muted">
                {item.createdAt?.toDate?.().toLocaleString("ko-KR") ?? ""}
              </p>
            </div>
            <button
              onClick={() => remove(item.id)}
              className="shrink-0 text-sm text-muted hover:text-red-500"
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DangerTab({ onDeleted }: { onDeleted: () => void }) {
  const { space } = useSpace();
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);

  if (!space) return null;

  const remove = async () => {
    if (confirmText !== space.slug) return;
    setBusy(true);
    try {
      await deleteSpace(space.id);
      onDeleted();
    } catch (err) {
      window.alert(`삭제에 실패했습니다: ${(err as Error).message}`);
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-red-500/40 p-5">
      <h2 className="font-medium text-red-500">매뉴얼 삭제</h2>
      <p className="mt-2 text-sm text-muted">
        모든 문서, 초안, 발행 이력, 피드백이 함께 사라집니다. 되돌릴 수 없습니다. 확인을 위해
        매뉴얼 주소 <code className="rounded bg-surface px-1">{space.slug}</code>를 입력하세요.
      </p>
      <input
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        aria-label="삭제 확인"
        className="mt-4 w-full rounded-md border border-input bg-background px-3 py-2"
      />
      <button
        onClick={remove}
        disabled={busy || confirmText !== space.slug}
        className="mt-4 rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
      >
        {busy ? "삭제 중…" : "영구 삭제"}
      </button>
    </div>
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
