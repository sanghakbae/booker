import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Draft, Feedback, Page, PageNode, Space, Version } from "./types";

const spacesRef = collection(db, "spaces");
const pagesRef = (spaceId: string) => collection(db, "spaces", spaceId, "pages");
const draftsRef = (spaceId: string) => collection(db, "spaces", spaceId, "drafts");
const versionsRef = (spaceId: string) => collection(db, "spaces", spaceId, "versions");
const feedbackRef = (spaceId: string) => collection(db, "spaces", spaceId, "feedback");

export function slugify(input: string) {
  const s = input
    .trim()
    .toLowerCase()
    // Keep unicode letters/numbers so Korean titles survive.
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return s || "untitled";
}

export function canEditSpace(space: Space | null, email: string | null, uid: string | null) {
  if (!space || !uid) return false;
  if (space.ownerId === uid) return true;
  return !!email && (space.editorEmails ?? []).includes(email);
}

// --- spaces ---------------------------------------------------------------

export async function listPublicSpaces(): Promise<Space[]> {
  const snap = await getDocs(
    query(spacesRef, where("visibility", "==", "public"), orderBy("title"))
  );
  return snap.docs.map(toSpace);
}

export async function listOwnedSpaces(ownerId: string): Promise<Space[]> {
  const snap = await getDocs(query(spacesRef, where("ownerId", "==", ownerId)));
  return snap.docs.map(toSpace);
}

/** Manuals shared with this account, found by the invited email. */
export async function listSharedSpaces(email: string): Promise<Space[]> {
  const snap = await getDocs(query(spacesRef, where("editorEmails", "array-contains", email)));
  return snap.docs.map(toSpace);
}

function toSpace(d: { id: string; data: () => Record<string, unknown> }): Space {
  // editorEmails predates nothing — older documents simply lack the field.
  return { editorEmails: [], ...d.data(), id: d.id } as unknown as Space;
}

/**
 * A space's document ID *is* its slug. Looking it up has to be a `get` rather
 * than a query: security rules evaluate a query against its constraints, and a
 * `where("slug", "==", …)` alone cannot prove the caller may read the result.
 */
export async function getSpaceBySlug(slug: string): Promise<Space | null> {
  try {
    const d = await getDoc(doc(db, "spaces", slug));
    return d.exists() ? toSpace(d) : null;
  } catch {
    // A private space owned by someone else reads as "not found".
    return null;
  }
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
  await setDoc(doc(db, "spaces", input.slug), {
    ...input,
    editorEmails: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return input.slug;
}

export async function updateSpace(
  spaceId: string,
  patch: Partial<Pick<Space, "title" | "description" | "visibility" | "editorEmails">>
) {
  await updateDoc(doc(db, "spaces", spaceId), { ...patch, updatedAt: serverTimestamp() });
}

/**
 * Changing an address means moving every document to a new ID, because the ID
 * is the slug. Old links break — the caller is expected to say so first.
 */
export async function moveSpace(space: Space, nextSlug: string) {
  if (nextSlug === space.id) return space.id;
  if (await getSpaceBySlug(nextSlug)) {
    throw new Error(`이미 사용 중인 주소입니다: /${nextSlug}`);
  }

  const [pages, drafts] = await Promise.all([listAllPages(space.id), listDrafts(space.id)]);

  const batch = writeBatch(db);
  batch.set(doc(db, "spaces", nextSlug), {
    slug: nextSlug,
    title: space.title,
    description: space.description,
    ownerId: space.ownerId,
    editorEmails: space.editorEmails ?? [],
    visibility: space.visibility,
    createdAt: space.createdAt ?? serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  for (const page of pages) {
    const { id, ...rest } = page;
    batch.set(doc(db, "spaces", nextSlug, "pages", id), rest);
    batch.delete(doc(db, "spaces", space.id, "pages", id));
  }
  for (const draft of drafts) {
    const { id, ...rest } = draft;
    batch.set(doc(db, "spaces", nextSlug, "drafts", id), rest);
    batch.delete(doc(db, "spaces", space.id, "drafts", id));
  }
  batch.delete(doc(db, "spaces", space.id));
  await batch.commit();
  return nextSlug;
}

export async function deleteSpace(spaceId: string) {
  const [pages, drafts, versions, feedback] = await Promise.all([
    listAllPages(spaceId),
    listDrafts(spaceId),
    getDocs(versionsRef(spaceId)),
    getDocs(feedbackRef(spaceId)),
  ]);
  const batch = writeBatch(db);
  pages.forEach((p) => batch.delete(doc(db, "spaces", spaceId, "pages", p.id)));
  drafts.forEach((d) => batch.delete(doc(db, "spaces", spaceId, "drafts", d.id)));
  versions.docs.forEach((v) => batch.delete(v.ref));
  feedback.docs.forEach((f) => batch.delete(f.ref));
  batch.delete(doc(db, "spaces", spaceId));
  await batch.commit();
}

// --- pages ----------------------------------------------------------------

/** Everything, including unpublished. Only editors may run this. */
export async function listAllPages(spaceId: string): Promise<Page[]> {
  const snap = await getDocs(query(pagesRef(spaceId), orderBy("order")));
  return snap.docs.map((d) => ({ id: d.id, published: false, ...d.data() }) as Page);
}

/**
 * What a reader is allowed to see. The `published` filter is not just a
 * convenience: without it the security rules reject the query outright.
 */
export async function listPublishedPages(spaceId: string): Promise<Page[]> {
  const snap = await getDocs(
    query(pagesRef(spaceId), where("published", "==", true), orderBy("order"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Page);
}

export async function listDrafts(spaceId: string): Promise<Draft[]> {
  try {
    const snap = await getDocs(draftsRef(spaceId));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Draft);
  } catch {
    return [];
  }
}

export async function getDraft(spaceId: string, pageId: string): Promise<Draft | null> {
  const d = await getDoc(doc(db, "spaces", spaceId, "drafts", pageId));
  return d.exists() ? ({ id: d.id, ...d.data() } as Draft) : null;
}

/** A new document starts as an unpublished stub plus a draft to write into. */
export async function createPage(
  spaceId: string,
  input: { title: string; slug: string; content?: string; parentId?: string | null }
) {
  const siblings = await listAllPages(spaceId);
  if (siblings.some((p) => p.slug === input.slug)) {
    throw new Error(`이미 사용 중인 주소입니다: ${input.slug}`);
  }
  const content = input.content ?? `# ${input.title}\n\n내용을 작성하세요.\n`;
  const order = siblings.length ? Math.max(...siblings.map((p) => p.order)) + 1 : 0;

  const ref = await addDoc(pagesRef(spaceId), {
    title: input.title,
    slug: input.slug,
    content: "",
    parentId: input.parentId ?? null,
    order,
    published: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await setDoc(doc(db, "spaces", spaceId, "drafts", ref.id), {
    title: input.title,
    content,
    parentId: input.parentId ?? null,
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function saveDraft(
  spaceId: string,
  pageId: string,
  input: { title: string; content: string; parentId: string | null }
) {
  await setDoc(doc(db, "spaces", spaceId, "drafts", pageId), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

/** Copies the draft into the published document and records a version. */
export async function publishPage(
  spaceId: string,
  pageId: string,
  draft: { title: string; content: string; parentId: string | null },
  authorEmail: string
) {
  await updateDoc(doc(db, "spaces", spaceId, "pages", pageId), {
    title: draft.title,
    content: draft.content,
    parentId: draft.parentId,
    published: true,
    updatedAt: serverTimestamp(),
    publishedAt: serverTimestamp(),
  });
  await addDoc(versionsRef(spaceId), {
    pageId,
    title: draft.title,
    content: draft.content,
    authorEmail,
    publishedAt: serverTimestamp(),
  });
}

/** Takes a document off the public site without deleting the draft. */
export async function unpublishPage(spaceId: string, pageId: string) {
  await updateDoc(doc(db, "spaces", spaceId, "pages", pageId), {
    published: false,
    content: "",
    updatedAt: serverTimestamp(),
  });
}

export async function updatePage(spaceId: string, pageId: string, patch: Partial<Page>) {
  await updateDoc(doc(db, "spaces", spaceId, "pages", pageId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePage(spaceId: string, pageId: string) {
  const pages = await listAllPages(spaceId);
  const removed = pages.find((p) => p.id === pageId);
  const batch = writeBatch(db);
  // Re-parent children so nothing is orphaned.
  pages
    .filter((p) => p.parentId === pageId)
    .forEach((p) =>
      batch.update(doc(db, "spaces", spaceId, "pages", p.id), {
        parentId: removed?.parentId ?? null,
      })
    );
  batch.delete(doc(db, "spaces", spaceId, "pages", pageId));
  batch.delete(doc(db, "spaces", spaceId, "drafts", pageId));
  await batch.commit();
}

/** Writes a whole reordered tree in one go. */
export async function savePageOrder(
  spaceId: string,
  items: Array<{ id: string; parentId: string | null; order: number }>
) {
  const batch = writeBatch(db);
  for (const item of items) {
    batch.update(doc(db, "spaces", spaceId, "pages", item.id), {
      parentId: item.parentId,
      order: item.order,
    });
  }
  await batch.commit();
}

/**
 * Documents created before drafts existed have no `published` field, so the
 * reader's `where("published", "==", true)` query skips them entirely. The
 * first editor to open the manual backfills the field and seeds a draft.
 * Only editors can write, which is why this cannot run for a plain reader.
 */
export async function migrateLegacyPages(spaceId: string): Promise<boolean> {
  const snap = await getDocs(pagesRef(spaceId));
  const legacy = snap.docs.filter((d) => d.data().published === undefined);
  if (legacy.length === 0) return false;

  const batch = writeBatch(db);
  for (const d of legacy) {
    const data = d.data();
    batch.update(d.ref, { published: true, publishedAt: data.updatedAt ?? serverTimestamp() });
    batch.set(doc(db, "spaces", spaceId, "drafts", d.id), {
      title: data.title ?? "제목 없음",
      content: data.content ?? "",
      parentId: data.parentId ?? null,
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
  return true;
}

// --- versions -------------------------------------------------------------

export async function listVersions(spaceId: string, pageId: string): Promise<Version[]> {
  const snap = await getDocs(
    query(versionsRef(spaceId), where("pageId", "==", pageId), orderBy("publishedAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Version);
}

// --- feedback -------------------------------------------------------------

export async function submitFeedback(
  spaceId: string,
  input: { pageId: string; pageSlug: string; helpful: boolean; comment: string }
) {
  await addDoc(feedbackRef(spaceId), { ...input, createdAt: serverTimestamp() });
}

export async function listFeedback(spaceId: string): Promise<Feedback[]> {
  const snap = await getDocs(query(feedbackRef(spaceId), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Feedback);
}

export async function deleteFeedback(spaceId: string, feedbackId: string) {
  await deleteDoc(doc(db, "spaces", spaceId, "feedback", feedbackId));
}

// --- tree helpers ---------------------------------------------------------

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
