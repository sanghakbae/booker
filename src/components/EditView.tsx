"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import {
  changePageSlug,
  deletePage,
  publishPage,
  findPageBySlug,
  saveDraft,
  slugify,
  unpublishPage,
} from "@/lib/db";
import type { Version } from "@/lib/types";
import { EmptyState, Loading } from "./Loading";
import { useT } from "./LocaleProvider";
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
  const t = useT();

  const page = useMemo(() => findPageBySlug(pages, slug).page, [pages, slug]);
  const draft = page ? drafts.get(page.id) : undefined;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  /** Set as soon as the user types, so a later load never overwrites them. */
  const [touched, setTouched] = useState(false);
  const loadedFor = useRef<string | null>(null);

  /**
   * Seeds the form from the draft, falling back to the published copy for
   * documents that predate drafts.
   *
   * It re-seeds while the form is untouched: the draft can arrive after the
   * page listing does, and seeding only once meant the editor kept showing the
   * published title — which looked exactly like a rename that had not saved.
   */
  useEffect(() => {
    if (!page) return;
    if (loadedFor.current === page.id && touched) return;
    loadedFor.current = page.id;
    setTitle(draft?.title ?? page.title);
    setContent(draft?.content ?? page.content);
    setParentId(draft?.parentId ?? page.parentId);
  }, [page, draft, touched]);

  // A different document starts over with an untouched form.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTouched(false);
  }, [slug]);

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
      await saveDraft(
        space.id,
        page.id,
        { title: title.trim() || t("editor.untitled"), content, parentId },
        { published: page.published }
      );
      await refresh();
      // The form is deliberately NOT re-seeded: autosave fires while the user
      // is still typing, and re-seeding would replace their newer text.
    } catch (err) {
      window.alert(t("editor.saveFailed", { message: (err as Error).message }));
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
      const body = { title: title.trim() || t("editor.untitled"), content, parentId };
      await saveDraft(space.id, page.id, body, { published: page.published });
      await publishPage(space.id, page.id, body, user?.email ?? t("editor.unknownAuthor"));
      await refresh();
    } catch (err) {
      window.alert(t("editor.publishFailed", { message: (err as Error).message }));
    } finally {
      setPublishing(false);
    }
  };

  const unpublish = async () => {
    if (!space || !page) return;
    setMenuOpen(false);
    if (!window.confirm(t("editor.confirmUnpublish", { title: page.title }))) return;
    await unpublishPage(space.id, page.id);
    await refresh();
  };

  const remove = async () => {
    if (!space || !page) return;
    setMenuOpen(false);
    if (!window.confirm(t("editor.confirmDelete", { title: page.title }))) return;
    await deletePage(space.id, page.id);
    await refresh();
    router.push(`/s/${space.slug}`);
  };

  /**
   * Derives the address from the current title. Kept as a separate action
   * rather than tying the address to the title: a document's address is what
   * other people have linked to, so it only moves when asked.
   */
  const matchAddress = async () => {
    if (!space || !page) return;
    setMenuOpen(false);
    const next = slugify(title || page.title);
    if (next === page.slug) {
      window.alert(t("editor.addressUnchanged"));
      return;
    }
    if (pages.some((p) => p.id !== page.id && p.slug === next)) {
      window.alert(t("editor.addressTaken", { slug: next }));
      return;
    }
    if (!window.confirm(t("editor.confirmMatchAddress", { from: page.slug, to: next }))) return;
    await changePageSlug(space.id, page, next);
    await refresh();
    router.replace(`/s/${space.slug}/${next}/edit`);
  };

  const rename = async () => {
    if (!space || !page) return;
    setMenuOpen(false);
    const next = window.prompt(t("editor.addressPrompt"), page.slug);
    if (!next) return;
    const slugified = slugify(next);
    if (slugified === page.slug) return;
    if (pages.some((p) => p.id !== page.id && p.slug === slugified)) {
      window.alert(t("editor.addressTaken", { slug: slugified }));
      return;
    }
    await changePageSlug(space.id, page, slugified);
    await refresh();
    router.replace(`/s/${space.slug}/${slugified}/edit`);
  };

  const restore = (version: Version) => {
    setTitle(version.title);
    setContent(version.content);
    setHistoryOpen(false);
  };

  if (loading) return <Loading label={t("common.loading")} />;
  if (!space || !page) return <EmptyState title={t("reader.pageNotFound")} />;
  if (!canEdit) {
    return <EmptyState title={t("editor.noPermission")} hint={t("editor.noPermissionHint")} />;
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
                onChange={(e) => {
                  setTouched(true);
                  setTitle(e.target.value);
                }}
                placeholder={t("editor.docTitle")}
                aria-label={t("editor.docTitle")}
                className="min-w-0 flex-1 bg-transparent text-xl font-semibold outline-none"
              />
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                  page.published
                    ? unpublishedChanges
                      ? "bg-warning/12 text-warning"
                      : "bg-success/12 text-success"
                    : "bg-surface text-muted"
                }`}
              >
                {page.published
                  ? unpublishedChanges
                    ? t("editor.badgePending")
                    : t("editor.badgePublished")
                  : t("editor.badgeDraft")}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 py-2">
              <label className="text-xs text-muted" htmlFor="parent-select">
                {t("editor.location")}
              </label>
              <select
                id="parent-select"
                value={parentId ?? ""}
                onChange={(e) => {
                  setTouched(true);
                  setParentId(e.target.value || null);
                }}
                className="rounded-md border border-input bg-background px-2 py-1 text-sm"
              >
                <option value="">{t("editor.topLevel")}</option>
                {pages
                  .filter((p) => p.id !== page.id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {t("editor.childOf", { title: p.title })}
                    </option>
                  ))}
              </select>

              {/* The 위치 select only sets nesting; sibling order lives in the
                  manual settings, which was not discoverable from here. */}
              <Link
                href={`/s/${space.slug}/settings#order`}
                className="text-xs text-accent hover:underline"
              >
                {t("editor.reorder")}
              </Link>

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={publish}
                  disabled={publishing || (!unpublishedChanges && !dirty)}
                  className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-40"
                >
                  {publishing ? t("editor.publishing") : t("editor.publishThis")}
                </button>

                <button
                  onClick={() => router.push(`/s/${space.slug}/${page.slug}`)}
                  className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface"
                >
                  {t("editor.viewAsReader")}
                </button>

                <div className="relative">
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-label={t("editor.docSettings")}
                    aria-expanded={menuOpen}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-surface"
                  >
                    <MoreIcon />
                  </button>

                  {menuOpen && (
                    <>
                      <button
                        aria-label={t("common.close")}
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
                          {t("editor.history")}
                        </button>
                        <button
                          onClick={matchAddress}
                          className="block w-full px-3 py-2.5 text-left text-sm hover:bg-surface"
                        >
                          {t("editor.matchAddress")}
                        </button>
                        <button
                          onClick={rename}
                          className="block w-full px-3 py-2.5 text-left text-sm hover:bg-surface"
                        >
                          {t("editor.changeAddress")}
                        </button>
                        {page.published && (
                          <button
                            onClick={unpublish}
                            className="block w-full px-3 py-2.5 text-left text-sm hover:bg-surface"
                          >
                            {t("editor.unpublish")}
                          </button>
                        )}
                        <button
                          onClick={remove}
                          className="block w-full px-3 py-2.5 text-left text-sm text-red-500 hover:bg-surface"
                        >
                          {t("editor.deleteDoc")}
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
            onChange={(next) => {
              setTouched(true);
              setContent(next);
            }}
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
