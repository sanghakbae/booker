"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/toc";
import { useT } from "./LocaleProvider";

/** Right-hand "On this page" rail, with the visible heading highlighted. */
export function Toc({ items }: { items: TocItem[] }) {
  const t = useT();
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    if (!items.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) {
    return <div style={{ width: "var(--toc-width)" }} className="hidden shrink-0 rail:block" />;
  }

  return (
    <aside
      style={{ width: "var(--toc-width)" }}
      className="hidden shrink-0 rail:block"
      aria-label={t("toc.label")}
    >
      <div className="sticky top-14 max-h-[calc(100dvh-3.5rem)] overflow-y-auto py-6 pr-4">
        <p className="pb-2 text-xs font-semibold tracking-wide text-muted">{t("toc.title")}</p>
        <ul className="space-y-1 border-l border-border">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                style={{ paddingLeft: item.depth === 3 ? "1.5rem" : "0.75rem" }}
                className={`-ml-px block border-l py-0.5 text-sm leading-snug ${
                  active === item.id
                    ? "border-accent text-accent"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
