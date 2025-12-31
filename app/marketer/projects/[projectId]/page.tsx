import { MarketerProjectDetail } from "@/components/marketer/project-detail";

export default async function MarketerProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <MarketerProjectDetail projectId={projectId} />;
}
