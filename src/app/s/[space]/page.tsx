import { SpaceIndex } from "@/components/SpaceIndex";
import { getPublishedSpaces } from "@/lib/build-data";

export { generateStaticParams } from "./layout";

export default async function SpaceIndexPage({
  params,
}: {
  params: Promise<{ space: string }>;
}) {
  const { space } = await params;
  const built = (await getPublishedSpaces()).find((s) => s.slug === decodeURIComponent(space));

  // The first published document, so the prerendered root already has content.
  return <SpaceIndex fallbackSlug={built?.pages[0]?.slug} />;
}
