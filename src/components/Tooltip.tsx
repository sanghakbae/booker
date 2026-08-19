"use client";

/**
 * Hover/focus label for icon-only controls. The native `title` attribute takes
 * about a second to appear and cannot show a shortcut, which left the toolbar
 * unreadable — every button is a bare glyph.
 */
export function Tooltip({
  label,
  shortcut,
  children,
}: {
  label: string;
  shortcut?: string;
  children: React.ReactNode;
}) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-foreground px-2 py-1 text-xs text-background opacity-0 shadow-sm transition-opacity delay-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {label}
        {shortcut && <span className="ml-1.5 opacity-60">{shortcut}</span>}
      </span>
    </span>
  );
}
