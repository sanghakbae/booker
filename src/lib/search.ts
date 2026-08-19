import type { Page } from "./types";

export type SearchHit = { page: Page; snippet: string; inTitle: boolean };

/** Strips markdown syntax so snippets read as prose. */
function plain(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[`*_>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Title and body search across one manual. Small enough to run in the browser —
 * a manual is tens of documents, not thousands.
 */
export function searchPages(pages: Page[], rawQuery: string): SearchHit[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return [];

  const hits: SearchHit[] = [];
  for (const page of pages) {
    const inTitle = page.title.toLowerCase().includes(query);
    const body = plain(page.content);
    const at = body.toLowerCase().indexOf(query);

    if (!inTitle && at === -1) continue;

    let snippet = "";
    if (at !== -1) {
      const from = Math.max(0, at - 30);
      snippet =
        (from > 0 ? "…" : "") +
        body.slice(from, at + query.length + 50) +
        (at + query.length + 50 < body.length ? "…" : "");
    } else {
      snippet = body.slice(0, 70) + (body.length > 70 ? "…" : "");
    }

    hits.push({ page, snippet, inTitle });
  }

  // Title matches are what people usually mean.
  return hits.sort((a, b) => Number(b.inTitle) - Number(a.inTitle));
}
