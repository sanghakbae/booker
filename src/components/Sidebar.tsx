"use client";

import { useEmbedded } from "@/lib/embedded";
import { useT } from "./LocaleProvider";
import { SidebarContent } from "./SidebarContent";

/** Desktop navigation rail. The mobile equivalent is MobileNav's drawer. */
export function Sidebar({ currentSlug }: { currentSlug?: string }) {
  const t = useT();
  const embedded = useEmbedded();

  return (
    <nav
      style={{ width: "var(--sidebar-width)" }}
      data-screen-only
      className="hidden shrink-0 border-r border-border md:block"
      aria-label={t("sidebar.docList")}
    >
      <div
        className={
          embedded
            ? "px-3 py-6"
            : "sticky top-14 max-h-[calc(100dvh-3.5rem)] overflow-y-auto px-3 py-6"
        }
      >
        <SidebarContent currentSlug={currentSlug} />
      </div>
    </nav>
  );
}
