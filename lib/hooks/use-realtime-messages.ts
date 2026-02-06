"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { BroadcastMessagePayload } from "@/lib/chat/broadcast";

/**
 * Subscribes to realtime broadcast events for a specific conversation.
 * When a `new_message` event arrives, the message is appended to the
 * React Query cache so it appears instantly without a refetch.
 */
export function useRealtimeMessages(
  conversationId: string | null | undefined,
  enabled = true,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId || !enabled) return;

    console.log("[Realtime] Subscribing to conversation channel:", `chat:conversation:${conversationId}`);

    const supabase = createClient();
    const channel = supabase.channel(`chat:conversation:${conversationId}`);

    channel
      .on("broadcast", { event: "new_message" }, ({ payload }) => {
        console.log("[Realtime] Received new_message:", payload);
        const msg = payload as BroadcastMessagePayload;
        if (!msg?.id) return;

        // Append to the messages cache (dedup by id)
        queryClient.setQueryData<{ data: Array<Record<string, unknown>> }>(
          ["chat-messages", conversationId],
          (old) => {
            if (!old) return old;
            const exists = old.data.some(
              (m) => (m as { id: string }).id === msg.id,
            );
            if (exists) {
              console.log("[Realtime] Message already exists in cache, skipping");
              return old;
            }
            console.log("[Realtime] Adding message to cache");
            return {
              ...old,
              data: [
                ...old.data,
                {
                  id: msg.id,
                  body: msg.body,
                  createdAt: msg.createdAt,
                  sender: msg.sender,
                },
              ],
            };
          },
        );

        // Also refresh the conversations list (for updated lastMessageAt / preview)
        void queryClient.invalidateQueries({
          queryKey: ["chat-conversations"],
        });
      })
      .subscribe((status) => {
        console.log("[Realtime] Conversation channel subscription status:", status);
      });

    return () => {
      console.log("[Realtime] Unsubscribing from conversation channel:", `chat:conversation:${conversationId}`);
      supabase.removeChannel(channel);
    };
  }, [conversationId, enabled, queryClient]);
}

/**
 * Subscribes to a user-level broadcast channel so that any new message
 * across all conversations triggers a refresh of unread counts and
 * conversation lists.
 */
export function useRealtimeUserChannel(
  userId: string | null | undefined,
  enabled = true,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId || !enabled) return;

    console.log("[Realtime] Subscribing to user channel:", `chat:user:${userId}`);

    const supabase = createClient();
    const channel = supabase.channel(`chat:user:${userId}`);

    channel
      .on("broadcast", { event: "conversation_updated" }, (payload) => {
        console.log("[Realtime] Received conversation_updated:", payload);
        void queryClient.invalidateQueries({
          queryKey: ["chat-conversations"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["chat-unread-count"],
        });
        // Also refresh invitation-messages queries (invitation chat proxies to conversations)
        void queryClient.invalidateQueries({
          queryKey: ["invitation-messages"],
        });
      })
      .subscribe((status) => {
        console.log("[Realtime] User channel subscription status:", status);
      });

    return () => {
      console.log("[Realtime] Unsubscribing from user channel:", `chat:user:${userId}`);
      supabase.removeChannel(channel);
    };
  }, [userId, enabled, queryClient]);
}
