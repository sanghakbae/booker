/** One loading treatment for every screen, instead of ad-hoc "불러오는 중…" text. */
export function Loading({ label = "…" }: { label?: string }) {
  return (
    <div
      style={{ maxWidth: "var(--content-width)" }}
      className="w-full animate-pulse px-4 py-10"
      role="status"
      aria-label={label}
    >
      <div className="h-8 w-1/2 rounded bg-surface" />
      <div className="mt-6 space-y-3">
        <div className="h-4 w-full rounded bg-surface" />
        <div className="h-4 w-11/12 rounded bg-surface" />
        <div className="h-4 w-4/5 rounded bg-surface" />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Shown when a manual or document does not exist. */
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="w-full px-4 py-16 text-center">
      <p className="font-medium">{title}</p>
      {hint && <p className="mt-2 text-sm text-muted">{hint}</p>}
    </div>
  );
}
