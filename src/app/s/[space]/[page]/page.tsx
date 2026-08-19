import type { Metadata } from "next";
import { Reader } from "@/components/Reader";
import { atLeastOne, FALLBACK_SLUG, getPublishedSpaces } from "@/lib/build-data";

export async function generateStaticParams() {
  const spaces = await getPublishedSpaces();
  return atLeastOne(
    spaces.flatMap((s) => s.pages.map((p) => ({ space: s.slug, page: p.slug }))),
    { space: FALLBACK_SLUG, page: FALLBACK_SLUG }
  );
}

/** Real titles and descriptions in the static HTML, for crawlers and link previews. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ space: string; page: string }>;
}): Promise<Metadata> {
  const { space, page } = await params;
  const built = (await getPublishedSpaces()).find((s) => s.slug === decodeURIComponent(space));
  const doc = built?.pages.find((p) => p.slug === decodeURIComponent(page));
  if (!built || !doc) return {};

  const summary = doc.content
    .replace(/^#.*$/gm, "")
    .replace(/[`*_>#|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

  return {
    title: `${doc.title} · ${built.title}`,
    description: summary || built.description,
    openGraph: { title: doc.title, description: summary || built.description },
  };
}

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  return <Reader slug={decodeURIComponent(page)} />;
}
