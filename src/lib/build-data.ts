/**
 * Build-time reads of the published manuals, over the Firestore REST API.
 *
 * `next build` runs in Node with no Firebase Admin credentials, so this goes
 * through the same public endpoint a browser would use — the security rules
 * still apply, which means only `visibility: "public"` spaces come back.
 * Used to prerender real HTML for crawlers; the client re-fetches on mount.
 */

const PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

export type BuiltPage = {
  id: string;
  slug: string;
  title: string;
  content: string;
  parentId: string | null;
  order: number;
};

export type BuiltSpace = {
  id: string;
  slug: string;
  title: string;
  description: string;
  pages: BuiltPage[];
};

type RestValue = Record<string, unknown>;

/** Unwraps Firestore's `{stringValue: "x"}` envelopes into plain values. */
function decode(fields: Record<string, RestValue> = {}): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, wrapper] of Object.entries(fields)) {
    const [kind, value] = Object.entries(wrapper)[0] ?? [];
    switch (kind) {
      case "integerValue":
        out[key] = Number(value);
        break;
      case "doubleValue":
        out[key] = value as number;
        break;
      case "booleanValue":
        out[key] = value as boolean;
        break;
      case "nullValue":
        out[key] = null;
        break;
      default:
        out[key] = value ?? null;
    }
  }
  return out;
}

const idFrom = (name: string) => name.split("/").pop() as string;

async function get(path: string) {
  if (!PROJECT || !KEY) return null;
  try {
    const res = await fetch(`${BASE}${path}${path.includes("?") ? "&" : "?"}key=${KEY}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    // A build should not fail because the network or the project is unreachable;
    // the app still works client-side, it just ships without prerendered content.
    return null;
  }
}

/**
 * Security rules judge a query by its constraints, not by the documents it
 * returns: listing /spaces unfiltered is denied, while the same listing with
 * `visibility == "public"` is allowed. So the space listing must be a query.
 */
async function queryPublicSpaces() {
  if (!PROJECT || !KEY) return [];
  try {
    const res = await fetch(`${BASE}:runQuery?key=${KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "spaces" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "visibility" },
              op: "EQUAL",
              value: { stringValue: "public" },
            },
          },
          limit: 300,
        },
      }),
    });
    if (!res.ok) return [];
    const rows: Array<{ document?: { name: string; fields?: Record<string, RestValue> } }> =
      await res.json();
    return rows.map((r) => r.document).filter((d) => !!d);
  } catch {
    return [];
  }
}

let cache: Promise<BuiltSpace[]> | null = null;

export function getPublishedSpaces(): Promise<BuiltSpace[]> {
  cache ??= load();
  return cache;
}

async function load(): Promise<BuiltSpace[]> {
  const docs = await queryPublicSpaces();

  const spaces: BuiltSpace[] = [];
  for (const doc of docs) {
    const data = decode(doc.fields);
    const id = idFrom(doc.name);
    const pageList = await get(`/spaces/${id}/pages?pageSize=500`);
    const pages: BuiltPage[] = ((pageList?.documents ?? []) as Array<{
      name: string;
      fields?: Record<string, RestValue>;
    }>)
      .map((p) => {
        const f = decode(p.fields);
        return {
          id: idFrom(p.name),
          slug: String(f.slug ?? ""),
          title: String(f.title ?? "제목 없음"),
          content: String(f.content ?? ""),
          parentId: (f.parentId as string | null) ?? null,
          order: Number(f.order ?? 0),
        };
      })
      .filter((p) => p.slug)
      .sort((a, b) => a.order - b.order);

    spaces.push({
      id,
      slug: String(data.slug ?? ""),
      title: String(data.title ?? "제목 없음"),
      description: String(data.description ?? ""),
      pages,
    });
  }
  return spaces.filter((s) => s.slug);
}

/**
 * `output: export` refuses to build a dynamic route that generates no paths.
 * When nothing is published yet, emit a throwaway route instead — real URLs
 * are still reachable through the 404.html client fallback.
 */
export const FALLBACK_SLUG = "_";

export function atLeastOne<T>(params: T[], placeholder: T): T[] {
  return params.length ? params : [placeholder];
}
