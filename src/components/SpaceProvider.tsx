"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { buildTree, getSpaceBySlug, listPages } from "@/lib/db";
import type { Page, PageNode, Space } from "@/lib/types";
import { useAuth } from "./AuthProvider";

type SpaceState = {
  space: Space | null;
  pages: Page[];
  tree: PageNode[];
  loading: boolean;
  canEdit: boolean;
  refresh: () => Promise<void>;
};

const SpaceContext = createContext<SpaceState | null>(null);

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
  const [loading, setLoading] = useState(!initialSpace);

  const refresh = useCallback(async () => {
    const found = await getSpaceBySlug(slug);
    setSpace(found);
    setPages(found ? await listPages(found.id) : []);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    // refresh() awaits Firestore before it sets state, so nothing is synchronous here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  return (
    <SpaceContext.Provider
      value={{
        space,
        pages,
        tree: buildTree(pages),
        loading,
        canEdit: !!user && !!space && space.ownerId === user.uid,
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
