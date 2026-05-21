"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { SimulatorEvent, SimulatorMessage } from "@/types/trace";

type ChatState = {
  messages: SimulatorMessage[];
  variables: Record<string, unknown>;
  awaitingNodeId: string | null;
  pendingChoices: { id: string; label: string }[] | null;
  pendingSuggestions: string[];
  ended: boolean;
};

const initialChat: ChatState = {
  messages: [],
  variables: {},
  awaitingNodeId: null,
  pendingChoices: null,
  pendingSuggestions: [],
  ended: false,
};

type ChatAction =
  | SimulatorEvent
  | { kind: "reset" }
  | {
      kind: "done_metadata";
      awaitingNodeId: string | null;
      variables: Record<string, unknown>;
    };

function reduceChat(prev: ChatState, action: ChatAction): ChatState {
  if (action.kind === "reset") {
    return initialChat;
  }
  if (action.kind === "done_metadata") {
    const awaiting = action.awaitingNodeId;
    return {
      ...prev,
      variables:
        action.variables && typeof action.variables === "object"
          ? { ...action.variables }
          : prev.variables,
      awaitingNodeId: awaiting,
      ended: !awaiting,
      pendingChoices: awaiting ? prev.pendingChoices : null,
      pendingSuggestions: awaiting ? prev.pendingSuggestions : [],
    };
  }

  const event = action;
  switch (event.kind) {
    case "message":
      return { ...prev, messages: [...prev.messages, event.message] };
    case "node_enter":
    case "node_exit":
      return prev;
    case "variable_set":
      return { ...prev, variables: { ...prev.variables, [event.variable]: event.value } };
    case "trace":
      return prev;
    case "request_input":
      return {
        ...prev,
        awaitingNodeId: event.nodeId ?? prev.awaitingNodeId,
        pendingChoices: event.choices ?? null,
        pendingSuggestions: event.suggestedReplies ?? [],
      };
    case "end":
      return { ...prev, ended: true };
    case "error":
      return { ...prev, ended: true };
    default:
      return prev;
  }
}

interface EmbedChatProps {
  flowId: string;
  embedToken: string;
  flowName: string;
}

export function EmbedChat({ flowId, embedToken, flowName }: EmbedChatProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [input, setInput] = useState("");
  const [chat, dispatchChat] = useReducer(reduceChat, initialChat);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const chatRef = useRef(chat);
  chatRef.current = chat;
  const conversationIdRef = useRef<string | null>(null);
  conversationIdRef.current = conversationId;

  const { messages, pendingChoices, pendingSuggestions, ended } = chat;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const runFlow = async (
    payload: { userMessage?: string; resumeFromNodeId?: string } = {},
    transcriptMessages?: SimulatorMessage[],
    ctx?: { conversationId?: string | null; variables?: Record<string, unknown> }
  ): Promise<{
    awaitingNodeId: string | null;
    conversationId: string | null;
    variables: Record<string, unknown>;
  } | null> => {
    const transcript = transcriptMessages ?? chatRef.current.messages;
    const vars = ctx?.variables ?? chatRef.current.variables;
    const convOverride =
      ctx !== undefined
        ? ctx.conversationId ?? conversationIdRef.current
        : conversationIdRef.current;
    let lastDone: {
      awaitingNodeId: string | null;
      conversationId: string | null;
      variables: Record<string, unknown>;
    } | null = null;
    setRunning(true);
    try {
      const res = await fetch(`/api/embed/${flowId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embedToken,
          conversationId: convOverride ?? undefined,
          variables: vars,
          conversationTranscript: transcript.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          ...payload,
        }),
      });
      if (!res.ok || !res.body) {
        const text = await res.text();
        throw new Error(text || `Execute failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const block of events) {
          const lines = block.split("\n");
          let eventName = "";
          let dataLine = "";
          for (const line of lines) {
            if (line.startsWith("event:")) eventName = line.slice(6).trim();
            else if (line.startsWith("data:")) dataLine += line.slice(5).trim();
          }
          if (!dataLine) continue;
          try {
            const parsed = JSON.parse(dataLine);
            if (eventName === "done") {
              const awaiting = (parsed.awaitingNodeId as string | null | undefined) ?? null;
              const cid = typeof parsed.conversationId === "string" ? parsed.conversationId : null;
              const nextVars =
                parsed.variables && typeof parsed.variables === "object"
                  ? (parsed.variables as Record<string, unknown>)
                  : {};
              lastDone = {
                awaitingNodeId: awaiting,
                conversationId: cid,
                variables: nextVars,
              };
              setConversationId(cid);
              dispatchChat({
                kind: "done_metadata",
                awaitingNodeId: awaiting,
                variables: nextVars,
              });
              setRunning(false);
            } else {
              dispatchChat(parsed as SimulatorEvent);
            }
          } catch {
            /* ignore malformed */
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Execution failed";
      toast.error(message);
    } finally {
      setRunning(false);
    }
    return lastDone;
  };

  /** Keep focus in the composer after send; avoid `disabled` on the input while running (that blurs it). */
  const focusComposer = () => {
    requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });
  };

  const handleSend = async (rawText?: string) => {
    if (running) {
      toast.info("Please wait…");
      return;
    }
    let text = (rawText ?? input).trim();
    if (!text && pendingSuggestions.length === 1) {
      text = pendingSuggestions[0].trim();
    }
    if (!text) {
      if (pendingSuggestions.length > 1) {
        toast.info("Pick a suggestion or type a message.");
      }
      return;
    }
    const userMsg: SimulatorMessage = {
      id: `msg_${nanoid(6)}`,
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    const transcriptAfterUser = [...messages, userMsg];
    dispatchChat({ kind: "message", message: userMsg });
    setInput("");

    if (chatRef.current.awaitingNodeId) {
      await runFlow(
        {
          userMessage: text,
          resumeFromNodeId: chatRef.current.awaitingNodeId,
        },
        transcriptAfterUser
      );
    } else if (!conversationIdRef.current) {
      const first = await runFlow({}, transcriptAfterUser);
      const pending = first?.awaitingNodeId;
      if (pending && first) {
        await runFlow(
          { userMessage: text, resumeFromNodeId: pending },
          transcriptAfterUser,
          {
            conversationId: first.conversationId,
            variables: first.variables,
          }
        );
      }
    } else {
      await runFlow({ userMessage: text }, transcriptAfterUser);
    }
    focusComposer();
  };

  const startConversation = async () => {
    setConversationId(null);
    conversationIdRef.current = null;
    dispatchChat({ kind: "reset" });
    chatRef.current = initialChat;
    setInput("");
    await runFlow({}, []);
    focusComposer();
  };

  return (
    <div className="flex h-full min-h-[320px] flex-col bg-background text-foreground">
      <div className="flex items-center justify-between border-b px-3 py-2.5">
        <span className="text-sm font-medium tracking-tight">{flowName}</span>
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl"
          onClick={startConversation}
          disabled={running}
        >
          <RotateCcw className="mr-1 h-3.5 w-3.5" />
          {conversationId ? "Restart" : "Start"}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="space-y-2.5 p-3">
          {messages.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Press Start to chat. This window may be embedded on another website.
            </p>
          ) : null}
          {messages.map((m) => {
            const deck =
              m.role === "assistant" && m.cards?.items && m.cards.items.length > 0
                ? m.cards
                : null;
            return (
              <div
                key={m.id}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[85%] rounded-2xl bg-primary px-3 py-2 text-sm text-primary-foreground shadow-sm"
                    : "mr-auto max-w-[min(92%,36rem)] rounded-2xl bg-muted px-3 py-2 text-sm"
                }
              >
                {deck ? (
                  <div className="space-y-2">
                    {m.content.trim() ? (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    ) : null}
                    <div
                      className={
                        deck.layout === "carousel"
                          ? "flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]"
                          : "flex flex-col gap-2"
                      }
                    >
                      {deck.items.map((card) => (
                        <article
                          key={card.id}
                          className={
                            deck.layout === "carousel"
                              ? "flex w-[min(100%,13.5rem)] min-w-[12rem] shrink-0 flex-col rounded-xl border border-border/80 bg-background/95 px-3 py-2.5 shadow-sm"
                              : "rounded-xl border border-border/80 bg-background/95 px-3 py-2.5 shadow-sm"
                          }
                        >
                          {card.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={card.imageUrl}
                              alt=""
                              className={
                                deck.layout === "carousel"
                                  ? "mb-2 max-h-24 w-full rounded-lg object-cover"
                                  : "mb-2 max-h-40 w-full rounded-lg object-cover sm:max-h-48"
                              }
                              referrerPolicy="no-referrer"
                            />
                          ) : null}
                          <h4
                            className={
                              deck.layout === "carousel"
                                ? "text-xs font-semibold leading-snug"
                                : "text-sm font-semibold leading-snug"
                            }
                          >
                            {card.title}
                          </h4>
                          {card.body ? (
                            <p
                              className={
                                deck.layout === "carousel"
                                  ? "mt-1.5 max-h-36 overflow-y-auto whitespace-pre-wrap break-words text-[11px] leading-relaxed text-muted-foreground [scrollbar-width:thin]"
                                  : "mt-1.5 whitespace-pre-wrap break-words text-xs leading-relaxed text-muted-foreground"
                              }
                            >
                              {card.body}
                            </p>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            );
          })}
          {pendingChoices && pendingChoices.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {pendingChoices.map((c) => (
                <Button
                  key={c.id}
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => handleSend(c.label)}
                  disabled={running}
                >
                  {c.label}
                </Button>
              ))}
            </div>
          ) : null}
          {pendingSuggestions.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {pendingSuggestions.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => handleSend(s)}
                  disabled={running}
                >
                  {s}
                </Button>
              ))}
            </div>
          ) : null}
          {running ? (
            <div className="mr-auto max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              Assistant is thinking…
            </div>
          ) : null}
          {ended && messages.length > 0 ? (
            <p className="text-xs text-muted-foreground">Conversation ended.</p>
          ) : null}
        </div>
      </ScrollArea>

      <form
        className="flex items-center gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          aria-busy={running}
          autoComplete="off"
        />
        <Button type="submit" disabled={running || !input.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
