"use client";

import {
  MessageCircle,
  Mic,
  ListChecks,
  GitBranch,
  Variable,
  Sparkles,
  Search,
  Globe,
  Workflow,
  StickyNote,
  Square,
  Play,
} from "lucide-react";
import type { NodeKind } from "@/types/flow";
import { useCanvasStore } from "@/stores/canvas-store";

interface PaletteEntry {
  kind: NodeKind;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const ENTRIES: PaletteEntry[] = [
  { kind: "start", label: "Start", icon: <Play className="h-4 w-4" />, description: "Entry point of the flow" },
  { kind: "message", label: "Message", icon: <MessageCircle className="h-4 w-4" />, description: "Speak / display text" },
  { kind: "capture", label: "Capture", icon: <Mic className="h-4 w-4" />, description: "Collect user input into a variable" },
  { kind: "choice", label: "Choice", icon: <ListChecks className="h-4 w-4" />, description: "Branch on multiple options" },
  { kind: "condition", label: "Condition", icon: <GitBranch className="h-4 w-4" />, description: "If / else / LLM router" },
  { kind: "set_variable", label: "Set Variable", icon: <Variable className="h-4 w-4" />, description: "Assign one or more variables" },
  { kind: "llm", label: "LLM", icon: <Sparkles className="h-4 w-4" />, description: "Local LLM call via Ollama" },
  { kind: "kb_search", label: "KB Search", icon: <Search className="h-4 w-4" />, description: "Local RAG retrieval" },
  { kind: "api_call", label: "API Call", icon: <Globe className="h-4 w-4" />, description: "Call an external HTTP endpoint" },
  { kind: "subflow", label: "Subflow", icon: <Workflow className="h-4 w-4" />, description: "Reuse another flow" },
  { kind: "comment", label: "Comment", icon: <StickyNote className="h-4 w-4" />, description: "Note for collaborators" },
  { kind: "end", label: "End", icon: <Square className="h-4 w-4" />, description: "Terminate the conversation" },
];

export function NodePalette() {
  const addNode = useCanvasStore((s) => s.addNode);
  return (
    <div className="flex flex-col gap-1 p-3">
      <h3 className="px-1 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Add Node
      </h3>
      {ENTRIES.map((entry) => (
        <button
          key={entry.kind}
          type="button"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("application/lvf-node", entry.kind);
            e.dataTransfer.effectAllowed = "move";
          }}
          onClick={() =>
            addNode(entry.kind, {
              x: 200 + Math.random() * 200,
              y: 200 + Math.random() * 200,
            })
          }
          className="group flex items-start gap-2 rounded-xl border bg-background/70 px-3 py-2.5 text-left text-sm transition-all hover:-translate-y-0.5 hover:bg-accent/80 hover:text-accent-foreground hover:shadow-sm"
          title={entry.description}
        >
          <span className="mt-0.5 rounded-lg bg-primary/10 p-1 text-primary transition-colors group-hover:bg-primary/20">
            {entry.icon}
          </span>
          <span className="flex flex-col">
            <span className="text-xs font-semibold leading-tight">{entry.label}</span>
            <span className="text-[10px] text-muted-foreground">{entry.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
