export type VariantId = "current" | "clean" | "editorial";

export const VARIANTS: Array<{ id: VariantId; name: string; summary: string }> = [
  {
    id: "current",
    name: "A · 현재",
    summary: "지금 배포된 스타일. 표는 전 셀 테두리, h2에 밑줄, 인라인 코드에 테두리.",
  },
  {
    id: "clean",
    name: "B · 정갈한 문서",
    summary:
      "선을 줄이고 여백으로 구분한다. 표는 가로선만, 인라인 코드는 테두리 없이 브랜드 톤, 안내 상자는 채운 박스.",
  },
  {
    id: "editorial",
    name: "C · 읽기 우선",
    summary:
      "본문 17px에 행간을 넓히고 제목을 크게 벌린다. 표에 옅은 줄무늬, 안내 상자는 왼쪽 굵은 선.",
  },
];

/**
 * Variant overrides, scoped by [data-doc-style]. Kept here rather than in
 * globals.css so the losing options can be deleted in one move once a style
 * is chosen.
 */
export const VARIANT_CSS = `
/* ---------- shared fixes, wanted in every variant ---------------------- */

[data-doc-style] .doc input[type="checkbox"] {
  appearance: none;
  width: 1.05em;
  height: 1.05em;
  margin-right: 0.5em;
  vertical-align: -0.17em;
  border: 1.5px solid var(--input-border);
  border-radius: 4px;
  background: var(--background);
}

[data-doc-style] .doc input[type="checkbox"]:checked {
  border-color: var(--accent);
  background: var(--accent);
  /* A tick drawn in the accent's own foreground, so it works in both themes. */
  background-image: linear-gradient(var(--accent), var(--accent));
  box-shadow: inset 0 0 0 2px var(--accent);
  position: relative;
}

[data-doc-style] .doc input[type="checkbox"]:checked::after {
  content: "";
  position: absolute;
  inset: 0;
  background: no-repeat center / 0.7em 0.7em
    url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3.2L13 5"/></svg>');
}

[data-doc-style] .doc li:has(> input[type="checkbox"]) {
  list-style: none;
  margin-left: -1.4rem;
}

/* ---------- B · clean --------------------------------------------------- */

[data-doc-style="clean"] .doc > h2 {
  border-bottom: 0;
  padding-bottom: 0;
  margin-top: 3.25rem;
  font-size: 1.6rem;
  letter-spacing: -0.015em;
}

[data-doc-style="clean"] .doc > h3 {
  margin-top: 2.25rem;
  font-size: 1.15rem;
  color: var(--foreground);
}

[data-doc-style="clean"] .doc code {
  border: 0;
  background: color-mix(in oklab, var(--accent) 10%, transparent);
  color: color-mix(in oklab, var(--accent) 75%, var(--foreground));
  font-size: 0.85em;
  padding: 0.15em 0.4em;
}

[data-doc-style="clean"] .doc pre {
  border: 0;
  background: color-mix(in oklab, var(--foreground) 5%, var(--background));
  border-radius: 10px;
  padding: 1.1rem 1.25rem;
}

[data-doc-style="clean"] .doc pre code {
  background: none;
  color: inherit;
}

/* Horizontal rules only: vertical grid lines make a table read as a dump. */
[data-doc-style="clean"] .doc table {
  font-size: 0.95rem;
}

[data-doc-style="clean"] .doc th,
[data-doc-style="clean"] .doc td {
  border: 0;
  border-bottom: 1px solid var(--border);
  padding: 0.7rem 1rem 0.7rem 0;
}

[data-doc-style="clean"] .doc th {
  background: none;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--muted);
  border-bottom: 1px solid var(--foreground);
  padding-bottom: 0.5rem;
}

[data-doc-style="clean"] .doc tr:last-child td {
  border-bottom: 0;
}

[data-doc-style="clean"] .doc blockquote {
  border: 0;
  border-radius: 10px;
  background: color-mix(in oklab, var(--accent) 8%, transparent);
  color: var(--foreground);
  padding: 1rem 1.15rem;
}

[data-doc-style="clean"] .doc blockquote > *:first-child {
  margin-top: 0;
}

[data-doc-style="clean"] .doc a {
  text-decoration-color: color-mix(in oklab, var(--accent) 40%, transparent);
  text-decoration-thickness: 1.5px;
}

[data-doc-style="clean"] .doc a:hover {
  text-decoration-color: var(--accent);
}

/* ---------- C · editorial ---------------------------------------------- */

[data-doc-style="editorial"] .doc {
  font-size: 1.0625rem;
  line-height: 1.85;
}

[data-doc-style="editorial"] .doc > h2 {
  border-bottom: 0;
  padding-bottom: 0;
  margin-top: 4rem;
  font-size: 1.75rem;
  letter-spacing: -0.02em;
}

[data-doc-style="editorial"] .doc > h3 {
  margin-top: 2.5rem;
  font-size: 1.2rem;
}

/* A small brand marker instead of a full-width rule. */
[data-doc-style="editorial"] .doc > h2::before {
  content: "";
  display: block;
  width: 28px;
  height: 3px;
  border-radius: 2px;
  background: var(--accent);
  margin-bottom: 0.9rem;
}

[data-doc-style="editorial"] .doc code {
  border: 0;
  background: var(--surface);
  font-size: 0.88em;
}

[data-doc-style="editorial"] .doc pre {
  border: 0;
  background: color-mix(in oklab, var(--foreground) 6%, var(--background));
  border-radius: 12px;
  padding: 1.25rem 1.4rem;
}

[data-doc-style="editorial"] .doc table {
  font-size: 0.95rem;
}

[data-doc-style="editorial"] .doc th,
[data-doc-style="editorial"] .doc td {
  border: 0;
  padding: 0.65rem 1rem;
}

[data-doc-style="editorial"] .doc th {
  background: none;
  border-bottom: 2px solid var(--border);
  color: var(--muted);
  font-size: 0.82rem;
}

[data-doc-style="editorial"] .doc tbody tr:nth-child(odd) {
  background: color-mix(in oklab, var(--surface) 70%, transparent);
}

[data-doc-style="editorial"] .doc blockquote {
  border-left: 4px solid var(--accent);
  border-radius: 0;
  background: none;
  color: var(--foreground);
  padding: 0.25rem 0 0.25rem 1.25rem;
}

[data-doc-style="editorial"] .doc blockquote > *:first-child {
  margin-top: 0;
}
`;
