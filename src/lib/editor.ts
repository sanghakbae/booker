/** Pure text transforms behind the editor toolbar. Each returns the next value
 *  plus where the selection should land, so the caller can restore the caret. */

export type Edit = { value: string; start: number; end: number };

type Input = { value: string; start: number; end: number };

const lineBounds = ({ value, start, end }: Input) => {
  const from = value.lastIndexOf("\n", start - 1) + 1;
  const toIdx = value.indexOf("\n", end);
  return { from, to: toIdx === -1 ? value.length : toIdx };
};

/** Wraps the selection in `before`/`after`, or unwraps it when already wrapped. */
export function toggleWrap(input: Input, before: string, after = before): Edit {
  const { value, start, end } = input;
  const selected = value.slice(start, end);
  const outerBefore = value.slice(Math.max(0, start - before.length), start);
  const outerAfter = value.slice(end, end + after.length);

  if (outerBefore === before && outerAfter === after) {
    const next =
      value.slice(0, start - before.length) + selected + value.slice(end + after.length);
    return { value: next, start: start - before.length, end: end - before.length };
  }
  if (selected.startsWith(before) && selected.endsWith(after) && selected.length >= before.length + after.length) {
    const inner = selected.slice(before.length, selected.length - after.length);
    return { value: value.slice(0, start) + inner + value.slice(end), start, end: start + inner.length };
  }
  const next = value.slice(0, start) + before + selected + after + value.slice(end);
  return { value: next, start: start + before.length, end: end + before.length };
}

/** Applies a `# `-style prefix to every selected line, toggling it off if all lines already have it. */
export function togglePrefix(input: Input, prefix: string): Edit {
  const { value } = input;
  const { from, to } = lineBounds(input);
  const lines = value.slice(from, to).split("\n");
  const has = lines.every((l) => l.startsWith(prefix));
  const next = lines.map((l) => (has ? l.slice(prefix.length) : prefix + l)).join("\n");
  const delta = next.length - (to - from);
  return {
    value: value.slice(0, from) + next + value.slice(to),
    start: Math.max(from, input.start + (has ? -prefix.length : prefix.length)),
    end: input.end + delta,
  };
}

/** Heading prefixes replace each other rather than stacking. */
export function setHeading(input: Input, level: 1 | 2 | 3): Edit {
  const { value } = input;
  const { from, to } = lineBounds(input);
  const prefix = "#".repeat(level) + " ";
  const lines = value.slice(from, to).split("\n");
  const stripped = lines.map((l) => l.replace(/^#{1,6}\s+/, ""));
  const alreadySet = lines.every((l) => l.startsWith(prefix));
  const next = stripped.map((l) => (alreadySet ? l : prefix + l)).join("\n");
  const delta = next.length - (to - from);
  return { value: value.slice(0, from) + next + value.slice(to), start: from, end: to + delta };
}

/** Numbered list, renumbered from 1 across the selection. */
export function toggleOrderedList(input: Input): Edit {
  const { value } = input;
  const { from, to } = lineBounds(input);
  const lines = value.slice(from, to).split("\n");
  const has = lines.every((l) => /^\d+\.\s/.test(l));
  const next = lines
    .map((l, i) => (has ? l.replace(/^\d+\.\s/, "") : `${i + 1}. ${l}`))
    .join("\n");
  const delta = next.length - (to - from);
  return { value: value.slice(0, from) + next + value.slice(to), start: from, end: to + delta };
}

/** Inserts a block, padded with blank lines so markdown parses it as its own block. */
export function insertBlock(input: Input, block: string): Edit {
  const { value, start, end } = input;
  const needsLeading = start > 0 && !value.slice(0, start).endsWith("\n\n");
  const needsTrailing = end < value.length && !value.slice(end).startsWith("\n\n");
  const lead = needsLeading ? (value.slice(0, start).endsWith("\n") ? "\n" : "\n\n") : "";
  const tail = needsTrailing ? "\n\n" : "";
  const next = value.slice(0, start) + lead + block + tail + value.slice(end);
  const caret = start + lead.length + block.length;
  return { value: next, start: caret, end: caret };
}

export function insertLink(input: Input, url: string, text?: string): Edit {
  const { value, start, end } = input;
  const label = value.slice(start, end) || text || "링크";
  const snippet = `[${label}](${url})`;
  return {
    value: value.slice(0, start) + snippet + value.slice(end),
    start: start + 1,
    end: start + 1 + label.length,
  };
}

export function makeTable(rows: number, cols: number): string {
  const header = `| ${Array.from({ length: cols }, (_, i) => `제목 ${i + 1}`).join(" | ")} |`;
  const divider = `| ${Array.from({ length: cols }, () => "---").join(" | ")} |`;
  const body = Array.from(
    { length: rows },
    () => `| ${Array.from({ length: cols }, () => " ").join(" | ")} |`
  ).join("\n");
  return [header, divider, body].join("\n");
}

/** Tab / Shift+Tab over one or more lines. */
export function indent(input: Input, outdent: boolean): Edit {
  const { value } = input;
  const { from, to } = lineBounds(input);
  const lines = value.slice(from, to).split("\n");
  const next = lines
    .map((l) => (outdent ? l.replace(/^ {1,2}/, "") : "  " + l))
    .join("\n");
  const delta = next.length - (to - from);
  return { value: value.slice(0, from) + next + value.slice(to), start: from, end: to + delta };
}

/**
 * Continues a list when Enter is pressed inside one. Returns null when the
 * current line is not a list item, so the caller can fall through to default.
 */
export function continueList(input: Input): Edit | null {
  const { value, start } = input;
  const from = value.lastIndexOf("\n", start - 1) + 1;
  const line = value.slice(from, start);

  const match = /^(\s*)(?:([-*+])\s(?:\[([ xX])\]\s)?|(\d+)\.\s)/.exec(line);
  if (!match) return null;

  const [prefix, spaces, bullet, checked, number] = match;
  // Enter on an empty item ends the list instead of adding another one.
  if (line.trim() === prefix.trim()) {
    const next = value.slice(0, from) + value.slice(start);
    return { value: next, start: from, end: from };
  }

  const marker = bullet
    ? `${spaces}${bullet} ${checked !== undefined ? "[ ] " : ""}`
    : `${spaces}${Number(number) + 1}. `;
  const insertion = "\n" + marker;
  const caret = start + insertion.length;
  return { value: value.slice(0, start) + insertion + value.slice(start), start: caret, end: caret };
}

export function stats(markdown: string) {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~|-]/g, " ");
  const chars = markdown.length;
  const words = plain.trim() ? plain.trim().split(/\s+/).length : 0;
  // Korean readers average ~500 characters per minute.
  const minutes = Math.max(1, Math.round(plain.replace(/\s/g, "").length / 500));
  return { chars, words, minutes };
}
