"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isToday, isYesterday } from "date-fns";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type MessageRow = {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; name: string | null; role: string };
};

type ChatProps = {
  invitationId: string;
  /** Current user's id – used to determine which bubbles are "mine" */
  currentUserId: string;
  /** Current user's role for display */
  currentUserRole: "founder" | "marketer";
  /** Counterparty name to show in header */
  counterpartyName: string;
  /** Optional className for the root container */
  className?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatMessageTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return `Yesterday ${format(d, "h:mm a")}`;
  return format(d, "MMM d, h:mm a");
}

function groupMessagesByDate(
  messages: MessageRow[],
): { label: string; messages: MessageRow[] }[] {
  const groups: { label: string; messages: MessageRow[] }[] = [];
  let currentLabel = "";
  let currentGroup: MessageRow[] = [];

  for (const m of messages) {
    const d = new Date(m.createdAt);
    let label: string;
    if (isToday(d)) label = "Today";
    else if (isYesterday(d)) label = "Yesterday";
    else label = format(d, "MMMM d, yyyy");

    if (label !== currentLabel) {
      if (currentGroup.length > 0) {
        groups.push({ label: currentLabel, messages: currentGroup });
      }
      currentLabel = label;
      currentGroup = [m];
    } else {
      currentGroup.push(m);
    }
  }

  if (currentGroup.length > 0) {
    groups.push({ label: currentLabel, messages: currentGroup });
  }

  return groups;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function InvitationChat({
  invitationId,
  currentUserId,
  currentUserRole,
  counterpartyName,
  className,
}: ChatProps) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const messagesQuery = useQuery<{ data: MessageRow[] }>({
    queryKey: ["invitation-messages", invitationId],
    queryFn: async () => {
      const res = await fetch(`/api/invitations/${invitationId}/messages`);
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to load messages");
      return json;
    },
    refetchInterval: 10000, // poll every 10s for new messages
  });

  const messages = useMemo(
    () => messagesQuery.data?.data ?? [],
    [messagesQuery.data],
  );

  const groupedMessages = useMemo(
    () => groupMessagesByDate(messages),
    [messages],
  );

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/invitations/${invitationId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to send message");

      setBody("");
      await queryClient.invalidateQueries({
        queryKey: ["invitation-messages", invitationId],
      });

      // Focus back on input
      inputRef.current?.focus();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  if (messagesQuery.isLoading) {
    return (
      <div
        className={cn(
          "flex h-[500px] items-center justify-center rounded-lg border bg-card",
          className,
        )}
      >
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading conversation...
        </div>
      </div>
    );
  }

  if (messagesQuery.error) {
    return (
      <div
        className={cn(
          "flex h-[500px] items-center justify-center rounded-lg border bg-card",
          className,
        )}
      >
        <div className="text-destructive text-sm">
          {messagesQuery.error instanceof Error
            ? messagesQuery.error.message
            : "Failed to load messages"}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border bg-card overflow-hidden",
        "h-[500px]",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-3">
        <Avatar size="sm">
          <AvatarFallback className="bg-primary/15 text-primary text-xs font-medium">
            {getInitials(counterpartyName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{counterpartyName}</div>
          <div className="text-xs text-muted-foreground">
            {currentUserRole === "founder" ? "Marketer" : "Founder"}
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
          Chat
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-5">
          {messages.length === 0 ? (
            <EmptyState counterpartyName={counterpartyName} />
          ) : (
            groupedMessages.map((group) => (
              <div key={group.label} className="space-y-4">
                {/* Date separator */}
                <div className="flex items-center gap-3 py-1">
                  <Separator className="flex-1" />
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    {group.label}
                  </span>
                  <Separator className="flex-1" />
                </div>

                {/* Messages in group */}
                <div className="space-y-3">
                  {group.messages.map((m) => (
                    <MessageBubble
                      key={m.id}
                      message={m}
                      isMine={m.sender.id === currentUserId}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input area - styled like shadcnuikit chat */}
      <div className="border-t bg-muted/20 p-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className={cn(
              "flex-1 rounded-full border bg-background px-4 py-2.5 text-sm",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
            disabled={isSending}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!body.trim() || isSending}
            className="shrink-0 rounded-full h-10 w-10"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function MessageBubble({
  message,
  isMine,
}: {
  message: MessageRow;
  isMine: boolean;
}) {
  return (
    <div className={cn("flex gap-2.5", isMine ? "flex-row-reverse" : "flex-row")}>
      <Avatar size="sm" className="shrink-0 mt-0.5">
        <AvatarFallback
          className={cn(
            "text-xs font-medium",
            isMine
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          {getInitials(message.sender.name)}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "flex flex-col max-w-[75%]",
          isMine ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
            isMine
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted rounded-bl-sm",
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
        </div>
        <span className="mt-1 px-1 text-[10px] text-muted-foreground">
          {formatMessageTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

function EmptyState({ counterpartyName }: { counterpartyName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <MessageSquare className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-sm mb-1">No messages yet</h3>
      <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">
        Start the conversation with {counterpartyName}. Messages you send will
        appear here.
      </p>
    </div>
  );
}
