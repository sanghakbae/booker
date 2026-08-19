"use client";

import { useState, useSyncExternalStore } from "react";

export const SITE_URL = "https://booker.sanghak.kr";

/** The origin never changes within a page load, so there is nothing to watch. */
const subscribeNever = () => () => {};

/** The manual's own public address, with one-click copy. */
export function ShareLink({ spaceSlug }: { spaceSlug: string }) {
  const [copied, setCopied] = useState(false);

  // On localhost the useful link is the local one, not the production domain.
  // The server has no location, so prerendering falls back to the real site.
  const origin = useSyncExternalStore(
    subscribeNever,
    () => window.location.origin,
    () => SITE_URL
  );

  const url = `${origin}/s/${encodeURIComponent(spaceSlug)}/`;
  const shown = url.replace(/^https?:\/\//, "");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("링크를 복사하세요", url);
    }
  };

  return (
    <div className="mt-6 rounded-md border border-border p-3">
      <p className="text-xs font-medium text-muted">이 매뉴얼의 공개 링크</p>
      <p className="mt-1 truncate font-mono text-xs" title={url}>
        {shown}
      </p>
      <button
        onClick={copy}
        className="mt-2 w-full rounded border border-border py-1 text-xs hover:bg-surface"
      >
        {copied ? "복사했습니다" : "링크 복사"}
      </button>
    </div>
  );
}
