import { MarketerProjectDetail } from "@/components/marketer/project-detail";

export default function MarketerProjectPage({
  params,
}: {
  params: { projectId: string };
}) {
  return <MarketerProjectDetail projectId={params.projectId} />;
}
