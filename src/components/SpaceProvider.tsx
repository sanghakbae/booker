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
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [space, setSpace] = useState<Space | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const found = await getSpaceBySlug(slug);
    setSpace(found);
    setPages(found ? await listPages(found.id) : []);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    setLoading(true);
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
