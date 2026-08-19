"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { deletePage, slugify, updatePage } from "@/lib/db";
import { EmptyState, Loading } from "./Loading";
import { MarkdownEditor } from "./MarkdownEditor";
import { MobileNav } from "./MobileNav";
import { MoreIcon } from "./Icons";
import { Sidebar } from "./Sidebar";
import { useSpace } from "./SpaceProvider";

export function EditView({ slug }: { slug: string }) {
  const { space, pages, loading, canEdit, refresh } = useSpace();
  const router = useRouter();

  const page = useMemo(() => pages.find((p) => p.slug === slug), [pages, slug]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
      // The form is deliberately NOT re-seeded here: autosave fires while the
      // user is still typing, and re-seeding would replace their newer text
      // with the copy that was just written to the server.
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
    setMenuOpen(false);
    if (!window.confirm(`"${page.title}" 문서를 삭제할까요? 되돌릴 수 없습니다.`)) return;
    await deletePage(space.id, page.id);
    await refresh();
    router.push(`/s/${space.slug}`);
  };

  const rename = async () => {
    if (!space || !page) return;
    setMenuOpen(false);
    const next = window.prompt("문서 주소", page.slug);
    if (!next) return;
    const slugified = slugify(next);
    if (slugified === page.slug) return;
    if (pages.some((p) => p.id !== page.id && p.slug === slugified)) {
      window.alert(`이미 사용 중인 주소입니다: ${slugified}`);
      return;
    }
    await updatePage(space.id, page.id, { slug: slugified });
    await refresh();
    router.replace(`/s/${space.slug}/${slugified}/edit`);
  };

  if (loading) return <Loading />;
  if (!space || !page) return <EmptyState title="문서를 찾을 수 없습니다" />;
  if (!canEdit) {
    return <EmptyState title="편집 권한이 없습니다" hint="이 매뉴얼의 소유자만 편집할 수 있습니다." />;
  }

  return (
    <>
      <MobileNav currentTitle={page.title} />

      <div className="flex min-h-0 flex-1">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* The title gets its own row: sharing one with the controls squeezed
              it to a few characters on narrow screens. */}
          <div className="border-b border-border px-4 pt-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="문서 제목"
              aria-label="문서 제목"
              className="w-full bg-transparent text-xl font-semibold outline-none"
            />

            <div className="flex flex-wrap items-center gap-2 py-2">
              <label className="text-xs text-muted" htmlFor="parent-select">
                위치
              </label>
              <select
                id="parent-select"
                value={parentId ?? ""}
                onChange={(e) => setParentId(e.target.value || null)}
                className="rounded-md border border-input bg-background px-2 py-1 text-sm"
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

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => router.push(`/s/${space.slug}/${page.slug}`)}
                  className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface"
                >
                  읽기로 보기
                </button>

                {/* Destructive actions live behind a menu instead of sitting
                    next to the controls used on every edit. */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-label="문서 설정"
                    aria-expanded={menuOpen}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-surface"
                  >
                    <MoreIcon />
                  </button>

                  {menuOpen && (
                    <>
                      <button
                        aria-label="메뉴 닫기"
                        onClick={() => setMenuOpen(false)}
                        className="fixed inset-0 z-40 cursor-default"
                      />
                      <div className="absolute right-0 z-50 mt-1 w-40 overflow-hidden rounded-md border border-border bg-background shadow-lg">
                        <button
                          onClick={rename}
                          className="block w-full px-3 py-2.5 text-left text-sm hover:bg-surface"
                        >
                          주소 변경
                        </button>
                        <button
                          onClick={remove}
                          className="block w-full px-3 py-2.5 text-left text-sm text-red-500 hover:bg-surface"
                        >
                          문서 삭제
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
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
      </div>
    </>
  );
}
