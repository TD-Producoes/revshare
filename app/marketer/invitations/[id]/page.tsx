import { redirect } from "next/navigation";
import { requireAuthUser } from "@/lib/auth";
import { InvitationThread } from "@/components/marketer/invitations/invitation-thread";

export default async function MarketerInvitationDetailPage({
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

  return <InvitationThread invitationId={id} />;
}
