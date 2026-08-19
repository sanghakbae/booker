import type { BuiltSpace } from "./build-data";
import type { Page, Space } from "./types";

/** Shapes build-time REST data into the same objects the client uses. */
export function toSpace(built: BuiltSpace): Space {
  return {
    id: built.id,
    slug: built.slug,
    title: built.title,
    description: built.description,
    ownerId: "",
    visibility: "public",
  };
}

export function toPages(built: BuiltSpace): Page[] {
  return built.pages.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    content: p.content,
    parentId: p.parentId,
    order: p.order,
  }));
}
