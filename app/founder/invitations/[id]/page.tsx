import { redirect } from "next/navigation";
import { requireAuthUser } from "@/lib/auth";
import { FounderInvitationThread } from "@/components/creator/invitations/invitation-thread";

export default async function FounderInvitationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireAuthUser();
  } catch {
    redirect("/login");
  }

  const { id } = await params;

  return <FounderInvitationThread invitationId={id} />;
}
