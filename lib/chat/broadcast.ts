import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type BroadcastMessagePayload = {
  id: string;
  conversationId: string;
  body: string;
  createdAt: string;
  sender: { id: string; name: string | null; role: string };
};

/**
 * Broadcasts a new chat message via Supabase Realtime so that connected
 * clients receive it instantly without polling.
 *
 * Two channels are used:
 * - `chat:conversation:{id}` — for clients viewing that specific conversation
 * - `chat:user:{userId}` — for each participant, so header unread counts update
 */
export async function broadcastNewMessage(
  payload: BroadcastMessagePayload,
  participantIds: string[],
) {
  try {
    const admin = getSupabaseAdmin();

    console.log("[Broadcast] Broadcasting message:", {
      conversationId: payload.conversationId,
      participantIds,
      messageId: payload.id,
    });

    // Broadcast to conversation channel (for active viewers)
    // Using .send() without subscribing uses HTTP, which is what we want for server-side
    const conversationChannel = admin.channel(
      `chat:conversation:${payload.conversationId}`,
    );
    const conversationResult = await conversationChannel.send({
      type: "broadcast",
      event: "new_message",
      payload,
    });
    console.log("[Broadcast] Conversation channel result:", conversationResult);
    admin.removeChannel(conversationChannel);

    // Broadcast to each participant's user channel (for unread counts)
    const userResults = await Promise.all(
      participantIds.map(async (uid) => {
        const userChannel = admin.channel(`chat:user:${uid}`);
        const result = await userChannel.send({
          type: "broadcast",
          event: "conversation_updated",
          payload: {
            conversationId: payload.conversationId,
            lastMessageAt: payload.createdAt,
            senderUserId: payload.sender.id,
          },
        });
        admin.removeChannel(userChannel);
        return { uid, result };
      }),
    );
    console.log("[Broadcast] User channels results:", userResults);
  } catch (error) {
    // Log error but don't break the API response
    console.error("[Broadcast] Broadcast failed:", error);
  }
}
