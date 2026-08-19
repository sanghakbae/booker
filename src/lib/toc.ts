import GithubSlugger from "github-slugger";

export type TocItem = { id: string; text: string; depth: 2 | 3 };

/**
 * Pulls h2/h3 headings out of markdown for the "On this page" rail.
 * Uses the same slugger as rehype-slug so the anchors line up.
 */
export function extractToc(markdown: string): TocItem[] {
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];
  let inFence = false;

  for (const line of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(#{2,3})\s+(.*\S)\s*$/.exec(line);
    if (!match) continue;
    const text = match[2].replace(/[*_`]/g, "");
    items.push({ id: slugger.slug(text), text, depth: match[1].length as 2 | 3 });
  }
  return items;
}
