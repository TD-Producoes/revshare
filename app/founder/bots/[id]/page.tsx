import { BotDetail } from "@/components/creator/bot-detail";

export default async function BotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BotDetail installationId={id} />;
}
