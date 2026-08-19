import { EditView } from "@/components/EditView";

export { generateStaticParams } from "../page";

export default async function EditPage({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  return <EditView slug={decodeURIComponent(page)} />;
}
