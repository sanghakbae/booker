import type { Timestamp } from "firebase/firestore";

export type Space = {
  id: string;
  slug: string;
  title: string;
  description: string;
  ownerId: string;
  visibility: "public" | "private";
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type Page = {
  id: string;
  slug: string;
  title: string;
  content: string;
  parentId: string | null;
  order: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

/** A page plus its children, as rendered in the sidebar. */
export type PageNode = Page & { children: PageNode[] };
