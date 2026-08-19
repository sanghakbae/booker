import type { Timestamp } from "firebase/firestore";

export type Space = {
  /** The document ID is the slug — see getSpaceBySlug for why. */
  id: string;
  slug: string;
  title: string;
  description: string;
  ownerId: string;
  /**
   * Invited editors, by email. A client cannot resolve an email to a uid, but
   * security rules can compare against request.auth.token.email, so the invite
   * works before the invitee has ever signed in.
   */
  editorEmails: string[];
  visibility: "public" | "private";
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

/** The published document. Readers only ever see these. */
export type Page = {
  id: string;
  slug: string;
  title: string;
  content: string;
  parentId: string | null;
  order: number;
  published: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  publishedAt?: Timestamp;
};

/**
 * The working copy, kept in a separate collection that only editors can read.
 * Keeping it out of the page document is what stops unpublished text from
 * leaking: security rules can hide a document, not a field.
 */
export type Draft = {
  id: string;
  title: string;
  content: string;
  parentId: string | null;
  updatedAt?: Timestamp;
};

/** A snapshot written every time a document is published. */
export type Version = {
  id: string;
  title: string;
  content: string;
  authorEmail: string;
  publishedAt?: Timestamp;
};

export type Feedback = {
  id: string;
  pageId: string;
  pageSlug: string;
  helpful: boolean;
  comment: string;
  createdAt?: Timestamp;
};

/** A page plus its children, as rendered in the sidebar. */
export type PageNode = Page & { children: PageNode[] };
