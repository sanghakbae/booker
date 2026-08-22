/**
 * Pure operations behind the document-order editor.
 *
 * The tree is edited as a flat list of rows with a depth, which is far easier
 * to reason about than nested arrays — and, being pure, testable.
 */

export type OutlineRow = { id: string; title: string; published: boolean; depth: number };

/** A row plus everything nested under it — what a drag or an indent moves. */
export function spanAt(rows: OutlineRow[], index: number) {
  let span = 1;
  while (index + span < rows.length && rows[index + span].depth > rows[index].depth) span++;
  return span;
}

/**
 * Re-clamps depths so no row sits more than one level below the row above it.
 *
 * The clamp has to read the depth it just wrote for the previous row, not the
 * incoming one: comparing against the original list let an earlier clamp go
 * unnoticed, so a run of indented siblings collapsed back to one.
 */
export function normalize(rows: OutlineRow[]): OutlineRow[] {
  const out: OutlineRow[] = [];
  rows.forEach((row, index) => {
    const max = index === 0 ? 0 : out[index - 1].depth + 1;
    out.push({ ...row, depth: Math.min(Math.max(0, row.depth), max) });
  });
  return out;
}

/** Moves the row at `from`, with its children, so it starts at `to`. */
export function move(rows: OutlineRow[], from: number, to: number): OutlineRow[] {
  if (from === to || to < 0 || to > rows.length) return rows;
  const span = spanAt(rows, from);
  // Dropping a parent inside its own subtree would detach it from the tree.
  if (to > from && to < from + span) return rows;

  const next = [...rows];
  const block = next.splice(from, span);
  next.splice(to > from ? to - span : to, 0, ...block);
  return normalize(next);
}

/** Swaps the row's subtree with the sibling block above or below it. */
export function nudge(rows: OutlineRow[], index: number, direction: -1 | 1): OutlineRow[] {
  const span = spanAt(rows, index);

  if (direction === 1) {
    const next = index + span;
    if (next >= rows.length) return rows;
    return move(rows, index, next + spanAt(rows, next));
  }

  let previous = index - 1;
  while (previous > 0 && rows[previous].depth > rows[index].depth) previous--;
  if (previous < 0) return rows;
  return move(rows, index, previous);
}

/** Indents or outdents a row, carrying its children with it. */
export function shift(rows: OutlineRow[], index: number, delta: number): OutlineRow[] {
  const span = spanAt(rows, index);
  // A row can only nest one level deeper than the row above it.
  const max = index === 0 ? 0 : rows[index - 1].depth + 1;
  const depth = Math.min(Math.max(0, rows[index].depth + delta), max);
  const applied = depth - rows[index].depth;
  if (applied === 0) return rows;

  const next = [...rows];
  for (let i = index; i < index + span; i++) {
    next[i] = { ...next[i], depth: Math.max(0, next[i].depth + applied) };
  }
  return normalize(next);
}

/**
 * Turns the flat list back into parent links: a row's parent is the nearest
 * row above it that sits one level shallower.
 */
export function toUpdates(rows: OutlineRow[]) {
  const stack: string[] = [];
  return rows.map((row, index) => {
    stack.length = row.depth;
    const parentId = row.depth === 0 ? null : (stack[row.depth - 1] ?? null);
    stack[row.depth] = row.id;
    return { id: row.id, parentId, order: index };
  });
}
