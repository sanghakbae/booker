import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Page, PageNode, Space } from "./types";

const spacesRef = collection(db, "spaces");
const pagesRef = (spaceId: string) => collection(db, "spaces", spaceId, "pages");

export function slugify(input: string) {
  const s = input
    .trim()
    .toLowerCase()
    // Keep unicode letters/numbers so Korean titles survive.
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return s || "untitled";
}

export async function listPublicSpaces(): Promise<Space[]> {
  const snap = await getDocs(
    query(spacesRef, where("visibility", "==", "public"), orderBy("title"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Space);
}

export async function listOwnedSpaces(ownerId: string): Promise<Space[]> {
  const snap = await getDocs(query(spacesRef, where("ownerId", "==", ownerId)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Space);
}

export async function getSpaceBySlug(slug: string): Promise<Space | null> {
  const snap = await getDocs(query(spacesRef, where("slug", "==", slug), limit(1)));
  const d = snap.docs[0];
  return d ? ({ id: d.id, ...d.data() } as Space) : null;
}

export async function createSpace(input: {
  title: string;
  slug: string;
  description: string;
  ownerId: string;
  visibility: Space["visibility"];
}) {
  const existing = await getSpaceBySlug(input.slug);
  if (existing) throw new Error(`이미 사용 중인 주소입니다: /${input.slug}`);
  const ref = await addDoc(spacesRef, {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateSpace(spaceId: string, patch: Partial<Space>) {
  await updateDoc(doc(db, "spaces", spaceId), { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteSpace(spaceId: string) {
  const pages = await listPages(spaceId);
  await Promise.all(pages.map((p) => deleteDoc(doc(db, "spaces", spaceId, "pages", p.id))));
  await deleteDoc(doc(db, "spaces", spaceId));
}

export async function listPages(spaceId: string): Promise<Page[]> {
  const snap = await getDocs(query(pagesRef(spaceId), orderBy("order")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Page);
}

export async function getPageBySlug(spaceId: string, slug: string): Promise<Page | null> {
  const snap = await getDocs(query(pagesRef(spaceId), where("slug", "==", slug), limit(1)));
  const d = snap.docs[0];
  return d ? ({ id: d.id, ...d.data() } as Page) : null;
}

export async function getPage(spaceId: string, pageId: string): Promise<Page | null> {
  const d = await getDoc(doc(db, "spaces", spaceId, "pages", pageId));
  return d.exists() ? ({ id: d.id, ...d.data() } as Page) : null;
}

export async function createPage(
  spaceId: string,
  input: { title: string; slug: string; content?: string; parentId?: string | null }
) {
  const siblings = await listPages(spaceId);
  if (siblings.some((p) => p.slug === input.slug)) {
    throw new Error(`이미 사용 중인 주소입니다: ${input.slug}`);
  }
  const ref = await addDoc(pagesRef(spaceId), {
    title: input.title,
    slug: input.slug,
    content: input.content ?? `# ${input.title}\n\n내용을 작성하세요.\n`,
    parentId: input.parentId ?? null,
    order: siblings.length,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePage(spaceId: string, pageId: string, patch: Partial<Page>) {
  await updateDoc(doc(db, "spaces", spaceId, "pages", pageId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePage(spaceId: string, pageId: string) {
  const pages = await listPages(spaceId);
  // Re-parent children to the deleted page's parent so nothing is orphaned.
  const removed = pages.find((p) => p.id === pageId);
  await Promise.all(
    pages
      .filter((p) => p.parentId === pageId)
      .map((p) => updatePage(spaceId, p.id, { parentId: removed?.parentId ?? null }))
  );
  await deleteDoc(doc(db, "spaces", spaceId, "pages", pageId));
}

/** Builds the sidebar tree. Pages whose parent is missing are treated as top level. */
export function buildTree(pages: Page[]): PageNode[] {
  const byId = new Map<string, PageNode>(pages.map((p) => [p.id, { ...p, children: [] }]));
  const roots: PageNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  const sort = (nodes: PageNode[]) => {
    nodes.sort((a, b) => a.order - b.order);
    nodes.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
}

/** Depth-first order, matching what the reader sees in the sidebar. */
export function flattenTree(nodes: PageNode[]): PageNode[] {
  return nodes.flatMap((n) => [n, ...flattenTree(n.children)]);
}
