import { ManualFooter, ManualHeader } from "@/components/ManualHeader";
import { SpaceProvider } from "@/components/SpaceProvider";
import { atLeastOne, FALLBACK_SLUG, getPublishedSpaces } from "@/lib/build-data";
import { toPages, toSpace } from "@/lib/prerender";

export async function generateStaticParams() {
  const spaces = await getPublishedSpaces();
  return atLeastOne(
    spaces.map((s) => ({ space: s.slug })),
    { space: FALLBACK_SLUG }
  );
}

export default async function SpaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ space: string }>;
}) {
  const { space } = await params;
  const slug = decodeURIComponent(space);
  const built = (await getPublishedSpaces()).find((s) => s.slug === slug);

  return (
    <SpaceProvider
      slug={slug}
      initialSpace={built ? toSpace(built) : null}
      initialPages={built ? toPages(built) : []}
    >
      <ManualHeader />
      {children}
      <ManualFooter />
    </SpaceProvider>
  );
}
