"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  buildTree,
  canEditSpace,
  getSpaceBySlug,
  listAllPages,
  listDrafts,
  listPublishedPages,
  migrateLegacyPages,
} from "@/lib/db";
import type { Draft, Page, PageNode, Space } from "@/lib/types";
import { useAuth } from "./AuthProvider";

type SpaceState = {
  space: Space | null;
  /** Published documents only — what the reader renders. */
  pages: Page[];
  /** Working copies, keyed by page id. Empty for readers. */
  drafts: Map<string, Draft>;
  tree: PageNode[];
  loading: boolean;
  canEdit: boolean;
  isOwner: boolean;
  refresh: () => Promise<void>;
};

const SpaceContext = createContext<SpaceState | null>(null);

/** Manuals already backfilled in this browser session. */
const migrated = new Set<string>();

export function SpaceProvider({
  slug,
  initialSpace = null,
  initialPages = [],
  children,
}: {
  slug: string;
  /** Prerendered at build time so crawlers see real content. */
  initialSpace?: Space | null;
  initialPages?: Page[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [space, setSpace] = useState<Space | null>(initialSpace);
  const [pages, setPages] = useState<Page[]>(initialPages);
  const [drafts, setDrafts] = useState<Map<string, Draft>>(new Map());
  const [loading, setLoading] = useState(!initialSpace);

  const email = user?.email ?? null;
  const uid = user?.uid ?? null;
  const editable = canEditSpace(space, email, uid);

  /**
   * The navigation tree. For an editor it shows the title being worked on,
   * not the published one: the sidebar is their workspace, and a rename that
   * did not appear there read as a rename that had not saved. Readers still
   * see published titles, and the "unpublished changes" badge is what says the
   * public copy differs.
   */
  const tree = useMemo(
    () =>
      buildTree(
        editable
          ? pages.map((page) => ({ ...page, title: drafts.get(page.id)?.title ?? page.title }))
          : pages
      ),
    [pages, drafts, editable]
  );

  const refresh = useCallback(async () => {
    const found = await getSpaceBySlug(slug);
    setSpace(found);

    if (!found) {
      setPages([]);
      setDrafts(new Map());
      setLoading(false);
      return;
    }

    // Editors see unpublished documents too; readers must not, and the security
    // rules reject the unfiltered query for them anyway.
    const editable = canEditSpace(found, email, uid);

    // Backfill pre-draft documents once per manual per session.
    if (editable && !migrated.has(found.id)) {
      migrated.add(found.id);
      try {
        await migrateLegacyPages(found.id);
      } catch {
        // Not fatal: the manual still loads, just without the backfill.
      }
    }
    const [list, draftList] = await Promise.all([
      editable ? listAllPages(found.id) : listPublishedPages(found.id),
      editable ? listDrafts(found.id) : Promise.resolve([]),
    ]);

    setPages(list);
    setDrafts(new Map(draftList.map((d) => [d.id, d])));
    setLoading(false);
  }, [slug, email, uid]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  return (
    <SpaceContext.Provider
      value={{
        space,
        pages,
        drafts,
        tree,
        loading,
        canEdit: editable,
        isOwner: !!space && !!uid && space.ownerId === uid,
        refresh,
      }}
    >
      {children}
    </SpaceContext.Provider>
  );
}

export function useSpace() {
  const ctx = useContext(SpaceContext);
  if (!ctx) throw new Error("useSpace must be used inside a SpaceProvider");
  return ctx;
}
