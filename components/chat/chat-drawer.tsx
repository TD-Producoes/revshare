"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Check,
  ChevronsUpDown,
  MessageSquareText,
  Plus,
  SendHorizontal,
} from "lucide-react";
import { toast } from "sonner";

type ConversationRow = {
  id: string;
  project: { id: string; name: string };
  founderId: string;
  marketerId: string;
  founder: { id: string; name: string | null; email: string | null };
  marketer: { id: string; name: string | null; email: string | null };
  lastMessageAt: string | null;
  messages: Array<{ body: string; createdAt: string; senderUserId: string }>;
};

type ConversationMessageRow = {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; name: string | null; role: string };
};

type StartOptionRow = {
  projectId: string;
  projectName: string;
  counterpartyId: string;
  counterpartyName: string | null;
  counterpartyEmail: string | null;
  kind: "FOUNDER_TO_MARKETER" | "MARKETER_TO_FOUNDER";
};

function initials(name?: string | null) {
  const v = (name ?? "?").trim();
  if (!v) return "?";
  return v
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function formatTime(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { month: "short", day: "numeric" });
}

function optionLabel(o: StartOptionRow) {
  return o.counterpartyName ?? o.counterpartyEmail ?? o.counterpartyId;
}

export function ChatDrawer({
  open,
  onOpenChange,
  viewerUserId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewerUserId: string;
}) {
  const queryClient = useQueryClient();

  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  // Start conversation selector state (shadcn combobox style)
  const [startOpen, setStartOpen] = useState(false);
  const [startNeedle, setStartNeedle] = useState("");

  const conversationsQuery = useQuery<{ data: ConversationRow[] }>({
    queryKey: ["chat-conversations"],
    enabled: open,
    queryFn: async () => {
      const res = await fetch("/api/chat/conversations");
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to load conversations");
      return json;
    },
  });

  const startOptionsQuery = useQuery<{ data: StartOptionRow[] }>({
    queryKey: ["chat-start-options"],
    enabled: open,
    queryFn: async () => {
      const res = await fetch("/api/chat/conversations/options");
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to load options");
      return json;
    },
  });

  const conversations = useMemo(() => {
    const list = conversationsQuery.data?.data ?? [];
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((c) => {
      const other = c.founderId === viewerUserId ? c.marketer : c.founder;
      return (
        c.project.name.toLowerCase().includes(needle) ||
        (other.name ?? "").toLowerCase().includes(needle) ||
        (other.email ?? "").toLowerCase().includes(needle)
      );
    });
  }, [conversationsQuery.data, q, viewerUserId]);

  useEffect(() => {
    if (!open) return;
    if (activeId) return;
    if (conversations.length > 0) setActiveId(conversations[0].id);
  }, [open, activeId, conversations]);

  // Reset selector search when opening
  useEffect(() => {
    if (!startOpen) {
      setStartNeedle("");
    }
  }, [startOpen]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  const messagesQuery = useQuery<{ data: ConversationMessageRow[] }>({
    queryKey: ["chat-messages", activeId ?? "none"],
    enabled: open && Boolean(activeId),
    queryFn: async () => {
      const res = await fetch(`/api/chat/conversations/${activeId}/messages`);
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to load messages");
      return json;
    },
  });

  const messages = messagesQuery.data?.data ?? [];

  const startOptions = useMemo(() => {
    const list = startOptionsQuery.data?.data ?? [];
    const needle = startNeedle.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((o) => {
      const who = optionLabel(o).toLowerCase();
      const proj = o.projectName.toLowerCase();
      return who.includes(needle) || proj.includes(needle);
    });
  }, [startOptionsQuery.data, startNeedle]);

  const startOptionsByProject = useMemo(() => {
    const map = new Map<string, { projectName: string; options: StartOptionRow[] }>();
    for (const o of startOptions) {
      const entry = map.get(o.projectId);
      if (!entry) {
        map.set(o.projectId, { projectName: o.projectName, options: [o] });
      } else {
        entry.options.push(o);
      }
    }
    return Array.from(map.entries()).map(([projectId, v]) => ({ projectId, ...v }));
  }, [startOptions]);

  const handleSend = async () => {
    if (!activeId) return;
    const trimmed = draft.trim();
    if (!trimmed) return;

    setSending(true);
    try {
      const res = await fetch(`/api/chat/conversations/${activeId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to send");
      setDraft("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["chat-messages", activeId] }),
        queryClient.invalidateQueries({ queryKey: ["chat-conversations"] }),
      ]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleStartConversation = async (o: StartOptionRow) => {
    try {
      const res = await fetch("/api/chat/conversations/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId: o.projectId, counterpartyId: o.counterpartyId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to start conversation");

      const convId = json?.data?.id as string | undefined;

      await queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      if (convId) {
        setActiveId(convId);
      }
      setStartOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start conversation");
    }
  };

  const selectedStartSummary = useMemo(() => {
    // Not keeping a selected state; we just start a conversation and focus it.
    // This summary exists to show context when there are no conversations.
    const total = startOptionsQuery.data?.data?.length ?? 0;
    if (total === 0) return "No people available yet";
    return "Choose a person (per project)…";
  }, [startOptionsQuery.data]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="p-0 data-[side=right]:w-[92vw] data-[side=right]:sm:w-[960px] data-[side=right]:sm:max-w-none"
        showCloseButton={true}
      >
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4" />
            Chat
          </SheetTitle>
          <SheetDescription>
            Conversations are per project. Start a conversation with someone you’re
            connected to through an invite or an approved contract.
          </SheetDescription>
        </SheetHeader>

        <div className="flex h-full min-h-0">
          {/* Left: conversations */}
          <div className="w-[320px] border-r flex flex-col min-h-0">
            <div className="p-4 space-y-3">
              <Popover open={startOpen} onOpenChange={setStartOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={startOpen}
                    className="w-full justify-between"
                    disabled={startOptionsQuery.isLoading}
                  >
                    <span className="inline-flex items-center gap-2 truncate">
                      <Plus className="h-4 w-4" />
                      <span className="truncate">Start conversation</span>
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[288px] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder={selectedStartSummary}
                      value={startNeedle}
                      onValueChange={setStartNeedle}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {startOptionsQuery.isLoading
                          ? "Loading…"
                          : "No matches."}
                      </CommandEmpty>
                      {startOptionsByProject.map((g) => (
                        <CommandGroup key={g.projectId} heading={g.projectName}>
                          {g.options.map((o) => (
                            <CommandItem
                              key={`${o.projectId}:${o.counterpartyId}`}
                              value={`${optionLabel(o)} ${o.projectName}`}
                              onSelect={() => void handleStartConversation(o)}
                            >
                              <Check className="ml-2 mr-2 h-4 w-4 opacity-0" />
                              <div className="min-w-0 flex-1">
                                <div className="truncate font-medium">
                                  {optionLabel(o)}
                                </div>
                                <div className="truncate text-[11px] text-muted-foreground">
                                  {o.projectName}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by project or person..."
              />
            </div>
            <Separator />

            <ScrollArea className="flex-1">
              <div className="p-2">
                {conversationsQuery.isLoading ? (
                  <div className="p-4 text-muted-foreground">Loading…</div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    <div className="font-semibold text-foreground">No conversations yet</div>
                    <div className="mt-1">
                      When you invite a marketer (or accept an invite), you can start chatting
                      here — conversations stay scoped to a specific project.
                    </div>
                    <div className="mt-3 flex flex-col gap-2">
                      <div className="text-xs text-muted-foreground">
                        Tip: use <span className="font-medium text-foreground">Start conversation</span> above.
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/founder/projects">Go to projects</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  conversations.map((c) => {
                    const other = c.founderId === viewerUserId ? c.marketer : c.founder;
                    const preview = c.messages?.[0]?.body ?? "";
                    const isActive = c.id === activeId;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setActiveId(c.id)}
                        className={cn(
                          "w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/40",
                          isActive && "bg-muted",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback>{initials(other.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="truncate font-semibold">
                                {other.name ?? other.email ?? other.id}
                              </div>
                              <div className="shrink-0 text-[10px] text-muted-foreground">
                                {formatTime(c.lastMessageAt)}
                              </div>
                            </div>
                            <div className="truncate text-[11px] text-muted-foreground">
                              {c.project.name}
                            </div>
                            {preview ? (
                              <div className="truncate text-[11px] text-muted-foreground">
                                {preview}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right: thread */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            {!activeConversation ? (
              <div className="flex flex-1 items-center justify-center text-muted-foreground">
                Select a conversation (or start a new one)
              </div>
            ) : (
              <>
                <div className="border-b p-4 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">
                      {activeConversation.project.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {activeConversation.founderId === viewerUserId
                        ? activeConversation.marketer.name ?? activeConversation.marketer.email
                        : activeConversation.founder.name ?? activeConversation.founder.email}
                    </div>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="space-y-3 p-4">
                    {messagesQuery.isLoading ? (
                      <div className="text-muted-foreground">Loading…</div>
                    ) : messages.length === 0 ? (
                      <div className="text-sm text-muted-foreground">
                        No messages yet.
                      </div>
                    ) : (
                      messages.map((m) => {
                        const mine = m.sender.id === viewerUserId;
                        return (
                          <div
                            key={m.id}
                            className={cn(
                              "flex",
                              mine ? "justify-end" : "justify-start",
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                                mine
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted",
                              )}
                            >
                              <div className="whitespace-pre-wrap break-words">
                                {m.body}
                              </div>
                              <div
                                className={cn(
                                  "mt-1 text-[10px] opacity-70",
                                  mine
                                    ? "text-primary-foreground"
                                    : "text-muted-foreground",
                                )}
                              >
                                {new Date(m.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>

                <div className="border-t p-4">
                  <div className="grid gap-2">
                    <Textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Write a message…"
                      className="min-h-[88px]"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={() => void handleSend()}
                        disabled={sending || !draft.trim()}
                      >
                        <SendHorizontal className="mr-2 h-4 w-4" />
                        {sending ? "Sending…" : "Send"}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
