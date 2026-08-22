"use client";

import { useMemo, useState } from "react";
import { flattenTree, savePageOrder } from "@/lib/db";
import { move, nudge, shift, toUpdates, type OutlineRow } from "@/lib/outline";
import type { PageNode } from "@/lib/types";
import { useT } from "./LocaleProvider";
import { useSpace } from "./SpaceProvider";

/** Depth of each node, so the tree can be edited as a flat list. */
function toRows(tree: PageNode[], depth = 0): OutlineRow[] {
  return tree.flatMap((node) => [
    { id: node.id, title: node.title, published: node.published, depth },
    ...toRows(node.children, depth + 1),
  ]);
}

export function PageOrderEditor() {
  const { space, tree, refresh } = useSpace();
  const t = useT();
  const initial = useMemo(() => toRows(tree), [tree]);
  const [rows, setRows] = useState<OutlineRow[] | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const current = rows ?? initial;
  const changed = rows !== null;

  const save = async () => {
    if (!space || !rows) return;
    setSaving(true);
    try {
      await savePageOrder(space.id, toUpdates(rows));
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
              if (from !== -1) setRows(move(current, from, index));
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
                { label: t("order.up"), sign: "↑", run: () => setRows(nudge(current, index, -1)) },
                { label: t("order.down"), sign: "↓", run: () => setRows(nudge(current, index, 1)) },
                { label: t("order.outdent"), sign: "⇤", run: () => setRows(shift(current, index, -1)) },
                { label: t("order.indent"), sign: "⇥", run: () => setRows(shift(current, index, 1)) },
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
