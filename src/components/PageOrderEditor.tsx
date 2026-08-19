"use client";

import { useMemo, useState } from "react";
import { flattenTree, savePageOrder } from "@/lib/db";
import type { PageNode } from "@/lib/types";
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
  const initial = useMemo(() => toRows(tree), [tree]);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const current = rows ?? initial;
  const changed = rows !== null;

  const move = (from: number, to: number) => {
    if (to < 0 || to >= current.length || from === to) return;
    const next = [...current];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setRows(normalize(next));
  };

  const shift = (index: number, delta: number) => {
    const next = [...current];
    // A row can only nest one level deeper than the row above it.
    const max = index === 0 ? 0 : next[index - 1].depth + 1;
    const depth = Math.min(Math.max(0, next[index].depth + delta), max);
    if (depth === next[index].depth) return;
    next[index] = { ...next[index], depth };
    setRows(normalize(next));
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
      window.alert(`저장에 실패했습니다: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  if (flattenTree(tree).length === 0) {
    return <p className="text-sm text-muted">아직 문서가 없습니다.</p>;
  }

  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        끌어서 순서를 바꾸고, 화살표로 상위·하위를 조정합니다.
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
                초안
              </span>
            )}

            <div className="flex shrink-0 items-center">
              {[
                { label: "위로", sign: "↑", run: () => move(index, index - 1) },
                { label: "아래로", sign: "↓", run: () => move(index, index + 1) },
                { label: "상위로", sign: "⇤", run: () => shift(index, -1) },
                { label: "하위로", sign: "⇥", run: () => shift(index, 1) },
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
          {saving ? "저장 중…" : "순서 저장"}
        </button>
        {changed && (
          <button onClick={() => setRows(null)} className="text-sm text-muted hover:text-foreground">
            되돌리기
          </button>
        )}
      </div>
    </div>
  );
}
