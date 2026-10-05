"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { sendMessage } from "@/app/(app)/messages/actions";
import { Button } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Chat({
  conversationId,
  meId,
  counterpartyLabel,
  initialMessages,
}: {
  conversationId: string;
  meId: string;
  counterpartyLabel: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  function append(message: Message) {
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
  }

  // Live updates: requires `messages` in the supabase_realtime publication (done in the migration).
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => append(payload.new as Message),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  function submit() {
    const body = draft.trim();
    if (!body || pending) return;
    setError(null);
    setDraft("");
    startTransition(async () => {
      const result = await sendMessage(conversationId, body);
      if (result.error) {
        setError(result.error);
        setDraft(body);
      } else if (result.message) {
        append(result.message);
      }
    });
  }

  return (
    <div className="flex h-[60vh] min-h-[420px] flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="py-12 text-center text-sm text-slate-500">
            No messages yet. Say hello to {counterpartyLabel} — remember, neither of you can see who the other is.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === meId;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                  mine ? "rounded-br-sm bg-teal-700 text-white" : "rounded-bl-sm bg-slate-100 text-slate-900",
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={cn("mt-1 text-[10px]", mine ? "text-teal-100" : "text-slate-500")}>
                  {mine ? "You" : counterpartyLabel} · {formatDateTime(m.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="border-t border-slate-200 p-3"
      >
        {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            placeholder="Write a message… (Enter to send, Shift+Enter for a new line)"
            className="flex-1 resize-none"
            maxLength={4000}
          />
          <Button type="submit" disabled={pending || !draft.trim()} aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          Don&apos;t share names, phone numbers or addresses here. Open a Deal Room to exchange them with your commercial terms
          protected.
        </p>
      </form>
    </div>
  );
}
