"use client";

import { SidebarContent } from "./SidebarContent";

/** Desktop navigation rail. The mobile equivalent is MobileNav's drawer. */
export function Sidebar() {
  return (
    <nav
      style={{ width: "var(--sidebar-width)" }}
      className="hidden shrink-0 border-r border-border md:block"
      aria-label="문서 목록"
    >
      <div className="sticky top-14 max-h-[calc(100dvh-3.5rem)] overflow-y-auto px-3 py-6">
        <SidebarContent />
      </div>
    </nav>
  );
}
