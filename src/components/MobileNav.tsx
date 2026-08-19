"use client";

import { useEffect, useState } from "react";
import { CloseIcon, MenuIcon } from "./Icons";
import { SidebarContent } from "./SidebarContent";
import { useSpace } from "./SpaceProvider";

/**
 * Below md the sidebar is hidden, which previously left phone readers with no
 * way to reach any other document. This puts the same tree behind a drawer.
 */
export function MobileNav({ currentTitle }: { currentTitle?: string }) {
  const { space } = useSpace();
  const [open, setOpen] = useState(false);

  // A drawer over a scrolled page should not scroll the page behind it.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!space) return null;

  return (
    <>
      <div className="sticky top-14 z-30 flex h-12 items-center gap-2 border-b border-border bg-background/90 px-2 backdrop-blur md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="문서 목록 열기"
          aria-expanded={open}
          className="flex h-11 w-11 items-center justify-center rounded-md hover:bg-surface"
        >
          <MenuIcon />
        </button>
        <span className="truncate text-sm text-muted">
          {space.title}
          {currentTitle && ` · ${currentTitle}`}
        </span>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <nav
            aria-label="문서 목록"
            className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col border-r border-border bg-background"
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-3">
              <span className="text-sm font-semibold">문서 목록</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="문서 목록 닫기"
                className="flex h-11 w-11 items-center justify-center rounded-md hover:bg-surface"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
              <SidebarContent onNavigate={() => setOpen(false)} />
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
