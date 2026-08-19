"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { useSpace } from "@/components/SpaceProvider";
import { deletePage, slugify, updatePage } from "@/lib/db";

export default function EditPage({ params }: { params: Promise<{ page: string }> }) {
  const { page: rawSlug } = use(params);
  const slug = decodeURIComponent(rawSlug);
  const { space, pages, loading, canEdit, refresh } = useSpace();
  const router = useRouter();

  const page = useMemo(() => pages.find((p) => p.slug === slug), [pages, slug]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const loadedFor = useRef<string | null>(null);

  // Seed the form once per page, so re-renders don't clobber in-progress edits.
  useEffect(() => {
    if (!page || loadedFor.current === page.id) return;
    loadedFor.current = page.id;
    setTitle(page.title);
    setContent(page.content);
    setParentId(page.parentId);
  }, [page]);

  const dirty =
    !!page && (title !== page.title || content !== page.content || parentId !== page.parentId);

  // A browser-level guard, since an accidental close would lose the draft.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const save = async () => {
    if (!space || !page || saving) return;
    setSaving(true);
    try {
      await updatePage(space.id, page.id, { title: title.trim() || "제목 없음", content, parentId });
      await refresh();
      loadedFor.current = null;
    } catch (err) {
      window.alert(`저장에 실패했습니다: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  // Autosave a couple of seconds after typing stops.
  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => void save(), 2500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, title, content, parentId]);

  const remove = async () => {
    if (!space || !page) return;
    if (!window.confirm(`"${page.title}" 문서를 삭제할까요? 되돌릴 수 없습니다.`)) return;
    await deletePage(space.id, page.id);
    await refresh();
    router.push(`/s/${space.slug}`);
  };

  const rename = async () => {
    if (!space || !page) return;
    const next = window.prompt("문서 주소", page.slug);
    if (!next || slugify(next) === page.slug) return;
    await updatePage(space.id, page.id, { slug: slugify(next) });
    await refresh();
    router.replace(`/s/${space.slug}/${slugify(next)}/edit`);
  };

  if (loading) return <main className="p-16 text-muted">불러오는 중…</main>;
  if (!space || !page) return <main className="p-16 text-muted">문서를 찾을 수 없습니다.</main>;
  if (!canEdit) return <main className="p-16 text-muted">편집 권한이 없습니다.</main>;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="문서 제목"
          className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none"
        />

        <select
          value={parentId ?? ""}
          onChange={(e) => setParentId(e.target.value || null)}
          className="rounded-md border border-border bg-background px-2 py-1 text-sm"
          title="상위 문서"
        >
          <option value="">최상위</option>
          {pages
            .filter((p) => p.id !== page.id)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} 하위
              </option>
            ))}
        </select>

        <button onClick={rename} className="text-sm text-muted hover:text-foreground">
          주소 변경
        </button>
        <button onClick={remove} className="text-sm text-red-500 hover:underline">
          삭제
        </button>
        <button
          onClick={() => router.push(`/s/${space.slug}/${page.slug}`)}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface"
        >
          읽기로 보기
        </button>
      </div>

      <MarkdownEditor
        value={content}
        onChange={setContent}
        onSave={save}
        saving={saving}
        dirty={dirty}
        spaceId={space.id}
      />
    </div>
  );
}
