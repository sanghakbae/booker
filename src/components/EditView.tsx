"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import {
  deletePage,
  publishPage,
  saveDraft,
  slugify,
  unpublishPage,
  updatePage,
} from "@/lib/db";
import type { Version } from "@/lib/types";
import { EmptyState, Loading } from "./Loading";
import { MarkdownEditor } from "./MarkdownEditor";
import { MobileNav } from "./MobileNav";
import { MoreIcon } from "./Icons";
import { Sidebar } from "./Sidebar";
import { useSpace } from "./SpaceProvider";
import { VersionHistory } from "./VersionHistory";

export function EditView({ slug }: { slug: string }) {
  const { space, pages, drafts, loading, canEdit, refresh } = useSpace();
  const { user } = useAuth();
  const router = useRouter();

  const page = useMemo(() => pages.find((p) => p.slug === slug), [pages, slug]);
  const draft = page ? drafts.get(page.id) : undefined;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const loadedFor = useRef<string | null>(null);

  // Seed once per document from the draft, falling back to the published copy
  // for documents that predate drafts.
  useEffect(() => {
    if (!page || loadedFor.current === page.id) return;
    loadedFor.current = page.id;
    setTitle(draft?.title ?? page.title);
    setContent(draft?.content ?? page.content);
    setParentId(draft?.parentId ?? page.parentId);
  }, [page, draft]);

  const dirty =
    !!page &&
    (title !== (draft?.title ?? page.title) ||
      content !== (draft?.content ?? page.content) ||
      parentId !== (draft?.parentId ?? page.parentId));

  const unpublishedChanges =
    !!page && (!page.published || title !== page.title || content !== page.content);

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
      await saveDraft(space.id, page.id, {
        title: title.trim() || "제목 없음",
        content,
        parentId,
      });
      await refresh();
      // The form is deliberately NOT re-seeded: autosave fires while the user
      // is still typing, and re-seeding would replace their newer text.
    } catch (err) {
      window.alert(`저장에 실패했습니다: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  // Autosave the draft a couple of seconds after typing stops.
  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => void save(), 2500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, title, content, parentId]);

  const publish = async () => {
    if (!space || !page || publishing) return;
    setPublishing(true);
    try {
      const body = { title: title.trim() || "제목 없음", content, parentId };
      await saveDraft(space.id, page.id, body);
      await publishPage(space.id, page.id, body, user?.email ?? "알 수 없음");
      await refresh();
    } catch (err) {
      window.alert(`발행에 실패했습니다: ${(err as Error).message}`);
    } finally {
      setPublishing(false);
    }
  };

  const unpublish = async () => {
    if (!space || !page) return;
    setMenuOpen(false);
    if (!window.confirm(`"${page.title}"을(를) 공개 사이트에서 내릴까요? 초안은 남습니다.`)) return;
    await unpublishPage(space.id, page.id);
    await refresh();
  };

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

  const restore = (version: Version) => {
    setTitle(version.title);
    setContent(version.content);
    setHistoryOpen(false);
  };

  if (loading) return <Loading />;
  if (!space || !page) return <EmptyState title="문서를 찾을 수 없습니다" />;
  if (!canEdit) {
    return <EmptyState title="편집 권한이 없습니다" hint="이 매뉴얼의 편집자만 수정할 수 있습니다." />;
  }

  return (
    <>
      <MobileNav currentTitle={page.title} />

      <div className="flex min-h-0 flex-1">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-border px-4 pt-3">
            <div className="flex items-center gap-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="문서 제목"
                aria-label="문서 제목"
                className="min-w-0 flex-1 bg-transparent text-xl font-semibold outline-none"
              />
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${
                  page.published
                    ? unpublishedChanges
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                      : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : "bg-surface text-muted"
                }`}
              >
                {page.published ? (unpublishedChanges ? "발행 대기 중" : "발행됨") : "초안"}
              </span>
            </div>

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
                  onClick={publish}
                  disabled={publishing || (!unpublishedChanges && !dirty)}
                  className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-40"
                >
                  {publishing ? "발행 중…" : "발행"}
                </button>

                <button
                  onClick={() => router.push(`/s/${space.slug}/${page.slug}`)}
                  className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface"
                >
                  읽기로 보기
                </button>

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
                      <div className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-md border border-border bg-background shadow-lg">
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            setHistoryOpen(true);
                          }}
                          className="block w-full px-3 py-2.5 text-left text-sm hover:bg-surface"
                        >
                          발행 이력
                        </button>
                        <button
                          onClick={rename}
                          className="block w-full px-3 py-2.5 text-left text-sm hover:bg-surface"
                        >
                          주소 변경
                        </button>
                        {page.published && (
                          <button
                            onClick={unpublish}
                            className="block w-full px-3 py-2.5 text-left text-sm hover:bg-surface"
                          >
                            발행 취소
                          </button>
                        )}
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

      {historyOpen && (
        <VersionHistory
          spaceId={space.id}
          pageId={page.id}
          onRestore={restore}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </>
  );
}
