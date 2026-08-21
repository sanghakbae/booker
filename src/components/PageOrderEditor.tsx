"use client";

import { useMemo, useState } from "react";
import { flattenTree, savePageOrder } from "@/lib/db";
import type { PageNode } from "@/lib/types";
import { useT } from "./LocaleProvider";
import { useSpace } from "./SpaceProvider";

type Row = { id: string; title: string; published: boolean; depth: number };

/** Depth of each node, so the tree can be edited as a flat list. */
function toRows(tree: PageNode[], depth = 0): Row[] {
  return tree.flatMap((node) => [
    { id: node.id, title: node.title, published: node.published, depth },
    ...toRows(node.children, depth + 1),
  ]);
}

/**
 * Turns the flat list back into parent links: an item's parent is the nearest
 * row above it that sits one level shallower.
 */
function toTreeUpdates(rows: Row[]) {
  const stack: string[] = [];
  return rows.map((row, index) => {
    stack.length = row.depth;
    const parentId = row.depth === 0 ? null : (stack[row.depth - 1] ?? null);
    stack[row.depth] = row.id;
    return { id: row.id, parentId, order: index };
  });
}

export function PageOrderEditor() {
  const { space, tree, refresh } = useSpace();
  const t = useT();
  const initial = useMemo(() => toRows(tree), [tree]);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const current = rows ?? initial;
  const changed = rows !== null;

  /** A row plus everything nested under it — what a drag actually moves. */
  const spanAt = (rows: Row[], index: number) => {
    let span = 1;
    while (index + span < rows.length && rows[index + span].depth > rows[index].depth) span++;
    return span;
  };

  /**
   * Moves the row at `from`, together with its children, so it starts at `to`.
   * Moving the row alone left its children behind, where they were silently
   * re-parented to whatever ended up above them.
   */
  const move = (from: number, to: number) => {
    const rows = [...current];
    if (from === to || to < 0 || to > rows.length) return;
    const span = spanAt(rows, from);
    // Dropping a parent inside its own subtree would detach it from the tree.
    if (to > from && to < from + span) return;

    const block = rows.splice(from, span);
    rows.splice(to > from ? to - span : to, 0, ...block);
    setRows(normalize(rows));
  };

  /** Swaps the row's subtree with the sibling block above or below it. */
  const nudge = (index: number, direction: -1 | 1) => {
    const rows = current;
    const span = spanAt(rows, index);

    if (direction === 1) {
      const next = index + span;
      if (next >= rows.length) return;
      move(index, next + spanAt(rows, next));
      return;
    }

    let previous = index - 1;
    while (previous > 0 && rows[previous].depth > rows[index].depth) previous--;
    if (previous < 0) return;
    move(index, previous);
  };

  /** Indent or outdent, carrying the children along. */
  const shiftBlock = (index: number, delta: number) => {
    const rows = [...current];
    const span = spanAt(rows, index);
    // A row can only nest one level deeper than the row above it.
    const max = index === 0 ? 0 : rows[index - 1].depth + 1;
    const depth = Math.min(Math.max(0, rows[index].depth + delta), max);
    const applied = depth - rows[index].depth;
    if (applied === 0) return;

    for (let i = index; i < index + span; i++) {
      rows[i] = { ...rows[i], depth: Math.max(0, rows[i].depth + applied) };
    }
    setRows(normalize(rows));
  };

  /** Re-clamps depths after a move so no row skips a level. */
  const normalize = (list: Row[]) =>
    list.map((row, i) => ({
      ...row,
      depth: i === 0 ? 0 : Math.min(row.depth, list[i - 1].depth + 1),
    }));

  const save = async () => {
    if (!space || !rows) return;
    setSaving(true);
    try {
      await savePageOrder(space.id, toTreeUpdates(rows));
      await refresh();
      setRows(null);
    } catch (err) {
      window.alert(t("order.saveFailed", { message: (err as Error).message }));
    } finally {
      setSaving(false);
    }
  };

  if (flattenTree(tree).length === 0) {
    return <p className="text-sm text-muted">{t("sidebar.noDocs")}</p>;
  }

  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        {t("order.hint")}
      </p>

      <ul className="overflow-hidden rounded-lg border border-border">
        {current.map((row, index) => (
          <li
            key={row.id}
            draggable
            onDragStart={() => setDragging(row.id)}
            onDragEnd={() => setDragging(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const from = current.findIndex((r) => r.id === dragging);
              if (from !== -1) move(from, index);
              setDragging(null);
            }}
            style={{ paddingLeft: `${0.75 + row.depth * 1.5}rem` }}
            className={`flex items-center gap-2 border-b border-border bg-background py-2 pr-2 last:border-b-0 ${
              dragging === row.id ? "opacity-40" : ""
            }`}
          >
            <span className="cursor-grab select-none text-muted" aria-hidden>
              ⠿
            </span>
            <span className="min-w-0 flex-1 truncate text-sm">{row.title}</span>
            {!row.published && (
              <span className="shrink-0 rounded bg-surface px-1.5 py-0.5 text-xs text-muted">
                {t("sidebar.draft")}
              </span>
            )}

            <div className="flex shrink-0 items-center">
              {[
                { label: t("order.up"), sign: "↑", run: () => nudge(index, -1) },
                { label: t("order.down"), sign: "↓", run: () => nudge(index, 1) },
                { label: t("order.outdent"), sign: "⇤", run: () => shiftBlock(index, -1) },
                { label: t("order.indent"), sign: "⇥", run: () => shiftBlock(index, 1) },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={action.run}
                  aria-label={`${row.title} ${action.label}`}
                  className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-surface hover:text-foreground"
                >
                  {action.sign}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={!changed || saving}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-40"
        >
          {saving ? t("common.saving") : t("order.save")}
        </button>
        {changed && (
          <button onClick={() => setRows(null)} className="text-sm text-muted hover:text-foreground">
            {t("common.revert")}
          </button>
        )}
      </div>
    </div>
  );
}
