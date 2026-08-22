"use client";

import { useState, useSyncExternalStore } from "react";
import { useT } from "./LocaleProvider";
import { useSpace } from "./SpaceProvider";

export const SITE_URL = "https://booker.sanghak.kr";

/** The origin never changes within a page load, so there is nothing to watch. */
const subscribeNever = () => () => {};

/** The manual's own public address, with one-click copy. */
export function ShareLink({ spaceSlug }: { spaceSlug: string }) {
  const t = useT();
  const { pages, canEdit } = useSpace();

  // Editors see every document; readers only ever see published ones.
  const published = pages.filter((page) => page.published).length;
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
      window.prompt(t("sidebar.copyPrompt"), url);
    }
  };

  return (
    <div className="mt-6 rounded-md border border-border p-3">
      <p className="text-xs font-medium text-muted">{t("sidebar.shareTitle")}</p>
      <p className="mt-1 truncate font-mono text-xs" title={url}>
        {shown}
      </p>
      {canEdit && (
        <p className="mt-1.5 text-xs text-muted">
          {t("sidebar.publishSummary", { published, total: pages.length })}
        </p>
      )}

      {/* Copying a link that shows an empty manual is the mistake worth
          warning about — the sender cannot tell from their own view. */}
      {canEdit && published === 0 && (
        <p className="mt-1.5 text-xs text-warning">{t("sidebar.nothingPublished")}</p>
      )}

      <button
        onClick={copy}
        className="mt-2 w-full rounded border border-border py-1 text-xs hover:bg-surface"
      >
        {copied ? t("sidebar.copied") : t("sidebar.copyLink")}
      </button>
    </div>
  );
}
