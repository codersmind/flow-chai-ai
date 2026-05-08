"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, Square, Volume2, VolumeX, RotateCcw } from "lucide-react";
import { useSimulatorStore } from "@/stores/simulator-store";
import { useCanvasStore } from "@/stores/canvas-store";
import type { SimulatorEvent, SimulatorMessage } from "@/types/trace";
import { isSttSupported, startBrowserStt } from "@/lib/stt/browser";
import { isTtsSupported, speak, cancelSpeech } from "@/lib/tts/browser";
import { toast } from "sonner";
import { nanoid } from "nanoid";

interface ChatPanelProps {
  flowId: string;
}

export function ChatPanel({ flowId }: ChatPanelProps) {
  const sim = useSimulatorStore();
  const setActiveNode = useCanvasStore((s) => s.setActiveNode);
  const [input, setInput] = useState("");
  const [voiceMode, setVoiceMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [ttsSupported, setTtsSupported] = useState(false);
  const sttHandleRef = useRef<{ stop: () => void } | null>(null);
  const lastSpokenIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setTtsSupported(isTtsSupported());
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sim.messages.length]);

  useEffect(() => {
    if (!ttsEnabled || !voiceMode) return;
    const last = sim.messages[sim.messages.length - 1] as SimulatorMessage | undefined;
    if (last && last.role === "assistant" && last.id !== lastSpokenIdRef.current) {
      lastSpokenIdRef.current = last.id;
      speak(last.content);
    }
  }, [sim.messages, ttsEnabled, voiceMode]);

  const handleEvent = (event: SimulatorEvent) => {
    if (event.kind === "node_enter") {
      setActiveNode(event.nodeId);
    } else if (event.kind === "node_exit") {
      setActiveNode(null);
    }
    sim.appendEvent(event);
  };

  const runFlow = async (payload: {
    userMessage?: string;
    resumeFromNodeId?: string;
  } = {}) => {
    sim.setRunning(true);
    try {
      const res = await fetch(`/api/flows/${flowId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: sim.conversationId,
          variables: sim.variables,
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
              const isAwaiting = !!parsed.awaitingNodeId;
              useSimulatorStore.setState({
                conversationId: parsed.conversationId,
                awaitingNodeId: parsed.awaitingNodeId,
                variables: parsed.variables ?? sim.variables,
                pendingChoices: isAwaiting
                  ? useSimulatorStore.getState().pendingChoices
                  : null,
                pendingSuggestions: isAwaiting
                  ? useSimulatorStore.getState().pendingSuggestions
                  : [],
                running: false,
                ended: !isAwaiting,
              });
            } else {
              handleEvent(parsed as SimulatorEvent);
            }
          } catch {
            /* swallow malformed lines */
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Execution failed";
      toast.error(message);
      sim.appendEvent({ kind: "error", error: message });
    } finally {
      sim.setRunning(false);
      setActiveNode(null);
    }
  };

  const handleSend = async (rawText?: string) => {
    if (sim.running) {
      toast.info("Please wait, assistant is still processing...");
      return;
    }
    const text = (rawText ?? input).trim();
    if (!text) return;
    const userMsg: SimulatorMessage = {
      id: `msg_${nanoid(6)}`,
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    sim.appendEvent({ kind: "message", message: userMsg });
    setInput("");
    if (sim.awaitingNodeId) {
      await runFlow({ userMessage: text, resumeFromNodeId: sim.awaitingNodeId });
    } else if (!sim.conversationId) {
      await runFlow({});
      // queue the message after first run completes if waiting
      const pendingNodeId = useSimulatorStore.getState().awaitingNodeId;
      if (pendingNodeId) {
        await runFlow({ userMessage: text, resumeFromNodeId: pendingNodeId });
      }
    } else {
      // Continue execution with fresh user input available as {{user_message}}
      await runFlow({ userMessage: text });
    }
  };

  const startConversation = async () => {
    sim.reset();
    setActiveNode(null);
    await runFlow({});
  };

  const toggleRecording = () => {
    if (recording && sttHandleRef.current) {
      sttHandleRef.current.stop();
      setRecording(false);
      return;
    }
    if (!isSttSupported()) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }
    setRecording(true);
    sttHandleRef.current = startBrowserStt({
      onPartial: (txt) => setInput(txt),
      onFinal: (txt) => {
        setRecording(false);
        if (txt.trim()) {
          handleSend(txt);
        }
      },
      onError: (err) => {
        setRecording(false);
        toast.error(err);
      },
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl"
            onClick={startConversation}
            disabled={sim.running}
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            {sim.conversationId ? "Restart" : "Start"}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
              className="rounded-xl"
            variant={voiceMode ? "default" : "outline"}
            onClick={() => setVoiceMode((v) => !v)}
            title="Voice mode"
          >
            {voiceMode ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </Button>
          {ttsSupported ? (
            <Button
              size="icon"
              className="rounded-xl"
              variant={ttsEnabled ? "default" : "outline"}
              onClick={() => {
                setTtsEnabled((v) => !v);
                if (ttsEnabled) cancelSpeech();
              }}
              title={ttsEnabled ? "Mute TTS" : "Enable TTS"}
            >
              {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          ) : null}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="space-y-2.5 p-3">
          {sim.messages.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Press Start to begin a simulation. Configure flow nodes on the left to see them
              respond live here.
            </p>
          ) : null}
          {sim.messages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[85%] rounded-2xl bg-primary px-3 py-2 text-sm text-primary-foreground shadow-sm"
                  : "mr-auto max-w-[85%] rounded-2xl bg-muted px-3 py-2 text-sm"
              }
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          ))}
          {sim.pendingChoices && sim.pendingChoices.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {sim.pendingChoices.map((c) => (
                <Button
                  key={c.id}
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => handleSend(c.label)}
                  disabled={sim.running}
                >
                  {c.label}
                </Button>
              ))}
            </div>
          ) : null}
          {sim.pendingSuggestions && sim.pendingSuggestions.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {sim.pendingSuggestions.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => handleSend(s)}
                  disabled={sim.running}
                >
                  {s}
                </Button>
              ))}
            </div>
          ) : null}
          {sim.running ? (
            <div className="mr-auto max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              Assistant is thinking...
            </div>
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
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={sim.running}
        />
        {voiceMode ? (
          <Button
            type="button"
            size="icon"
            className="rounded-xl"
            variant={recording ? "destructive" : "outline"}
            onClick={toggleRecording}
          >
            {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        ) : null}
        <Button type="submit" disabled={sim.running || !input.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
