/**
 * Writes public/search-index.json before `next build`.
 *
 * Search across every manual cannot query Firestore from the browser — the
 * rules reject an unconstrained read, and pulling every document on each visit
 * would be slow. Instead the published corpus is baked into one file at build
 * time, the same moment the static pages are generated.
 */
import { writeFile, mkdir } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";

// The build runs before Next loads .env files, so read them here.
for (const file of [".env.production", ".env.local"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

const PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

const decode = (fields = {}) =>
  Object.fromEntries(
    Object.entries(fields).map(([key, wrapper]) => {
      const [kind, value] = Object.entries(wrapper)[0] ?? [];
      if (kind === "integerValue") return [key, Number(value)];
      if (kind === "booleanValue") return [key, value];
      if (kind === "nullValue") return [key, null];
      return [key, value ?? null];
    })
  );

const idFrom = (name) => name.split("/").pop();

async function runQuery(parent, collectionId, filter) {
  const url = parent ? `${BASE}/${parent}:runQuery?key=${KEY}` : `${BASE}:runQuery?key=${KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId }],
        ...(filter ? { where: filter } : {}),
        limit: 1000,
      },
    }),
  });
  if (!res.ok) return [];
  const rows = await res.json();
  return rows.map((r) => r.document).filter(Boolean);
}

const equals = (field, value) => ({
  fieldFilter: { field: { fieldPath: field }, op: "EQUAL", value: { booleanValue: value } },
});

/** Trim markdown down to searchable prose and cap the stored size. */
function plain(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[`*_>|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);
}

async function main() {
  const entries = [];

  if (PROJECT && KEY) {
    try {
      const spaces = await runQuery(null, "spaces", {
        fieldFilter: {
          field: { fieldPath: "visibility" },
          op: "EQUAL",
          value: { stringValue: "public" },
        },
      });

      for (const spaceDoc of spaces) {
        const space = decode(spaceDoc.fields);
        const spaceId = idFrom(spaceDoc.name);
        const pages = await runQuery(`spaces/${spaceId}`, "pages", equals("published", true));

        for (const pageDoc of pages) {
          const page = decode(pageDoc.fields);
          if (!page.slug) continue;
          entries.push({
            spaceSlug: space.slug ?? spaceId,
            spaceTitle: space.title ?? spaceId,
            slug: page.slug,
            title: page.title ?? "제목 없음",
            text: plain(String(page.content ?? "")),
          });
        }
      }
    } catch (err) {
      // A build must not fail because the index could not be refreshed.
      console.warn(`[search-index] 색인 생성 실패, 빈 색인으로 진행합니다: ${err.message}`);
    }
  }

  await mkdir("public", { recursive: true });
  await writeFile("public/search-index.json", JSON.stringify(entries));
  console.log(`[search-index] 문서 ${entries.length}건 색인`);
}

await main();
