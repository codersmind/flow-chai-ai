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
  Layers,
  Wrench,
  Brain,
  Calculator,
  Braces,
  LayoutGrid,
} from "lucide-react";
import type { NodeKind } from "@/types/flow";
import { useCanvasStore } from "@/stores/canvas-store";

interface PaletteEntry {
  kind: NodeKind;
  label: string;
  voiceflowLabel?: string;
  icon: React.ReactNode;
  description: string;
}

interface PaletteSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  entries: PaletteEntry[];
}

const SECTIONS: PaletteSection[] = [
  {
    id: "flow",
    title: "Flow",
    icon: <Layers className="h-3.5 w-3.5" />,
    entries: [
      {
        kind: "start",
        label: "Start",
        voiceflowLabel: "Chat started",
        icon: <Play className="h-4 w-4" />,
        description: "Where the conversation begins",
      },
      {
        kind: "end",
        label: "End",
        voiceflowLabel: "End",
        icon: <Square className="h-4 w-4" />,
        description: "Stop this path cleanly",
      },
    ],
  },
  {
    id: "interaction",
    title: "Interaction",
    icon: <MessageCircle className="h-3.5 w-3.5" />,
    entries: [
      {
        kind: "message",
        label: "Message",
        voiceflowLabel: "Message",
        icon: <MessageCircle className="h-4 w-4" />,
        description: "Assistant text (templates with {{vars}})",
      },
      {
        kind: "capture",
        label: "Capture",
        voiceflowLabel: "Listen",
        icon: <Mic className="h-4 w-4" />,
        description: "Wait for user text; save to a variable (raw or AI-clean)",
      },
      {
        kind: "choice",
        label: "Choice",
        voiceflowLabel: "Buttons",
        icon: <ListChecks className="h-4 w-4" />,
        description: "Tappable options that branch the flow",
      },
      {
        kind: "cards",
        label: "Cards",
        voiceflowLabel: "Cards / Carousel",
        icon: <LayoutGrid className="h-4 w-4" />,
        description: "Rich card rows (stack or horizontal carousel) in the simulator",
      },
    ],
  },
  {
    id: "logic",
    title: "Logic",
    icon: <GitBranch className="h-3.5 w-3.5" />,
    entries: [
      {
        kind: "condition",
        label: "Condition",
        voiceflowLabel: "Condition",
        icon: <GitBranch className="h-4 w-4" />,
        description: "Rules or LLM router between paths",
      },
      {
        kind: "set_variable",
        label: "Set Variable",
        voiceflowLabel: "Set",
        icon: <Variable className="h-4 w-4" />,
        description: "Assign {{vars}}; optional AI extract from last line",
      },
      {
        kind: "operator",
        label: "Operator",
        voiceflowLabel: "Operator",
        icon: <Calculator className="h-4 w-4" />,
        description: "Math and string steps (add, concat, replace, …)",
      },
      {
        kind: "function",
        label: "Function",
        voiceflowLabel: "Function / Code",
        icon: <Braces className="h-4 w-4" />,
        description: "JEXL expression on variables → output variable",
      },
      {
        kind: "subflow",
        label: "Subflow",
        voiceflowLabel: "Workflow",
        icon: <Workflow className="h-4 w-4" />,
        description: "Jump into another saved flow and return",
      },
      {
        kind: "comment",
        label: "Comment",
        icon: <StickyNote className="h-4 w-4" />,
        description: "Sticky note on the canvas (not executed)",
      },
    ],
  },
  {
    id: "ai",
    title: "AI & knowledge",
    icon: <Brain className="h-3.5 w-3.5" />,
    entries: [
      {
        kind: "llm",
        label: "LLM",
        voiceflowLabel: "Agent",
        icon: <Sparkles className="h-4 w-4" />,
        description: "Full model turn; save reply to a variable",
      },
      {
        kind: "kb_search",
        label: "KB Search",
        voiceflowLabel: "Knowledge base",
        icon: <Search className="h-4 w-4" />,
        description: "Retrieve chunks from this project’s KB",
      },
    ],
  },
  {
    id: "tools",
    title: "Tools",
    icon: <Wrench className="h-3.5 w-3.5" />,
    entries: [
      {
        kind: "api_call",
        label: "API Call",
        voiceflowLabel: "API / Integration",
        icon: <Globe className="h-4 w-4" />,
        description: "GET/POST JSON; map body with {{vars}}",
      },
    ],
  },
];

function PaletteButton({ entry }: { entry: PaletteEntry }) {
  const addNode = useCanvasStore((s) => s.addNode);
  return (
    <button
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
      className="group flex w-full items-start gap-2 rounded-xl border bg-background/70 px-3 py-2.5 text-left text-sm transition-all hover:-translate-y-0.5 hover:bg-accent/80 hover:text-accent-foreground hover:shadow-sm"
      title={entry.description}
    >
      <span className="mt-0.5 shrink-0 rounded-lg bg-primary/10 p-1 text-primary transition-colors group-hover:bg-primary/20">
        {entry.icon}
      </span>
      <span className="min-w-0 flex flex-col">
        <span className="text-xs font-semibold leading-tight">{entry.label}</span>
        {entry.voiceflowLabel ? (
          <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground/90">
            VF: {entry.voiceflowLabel}
          </span>
        ) : null}
        <span className="text-[10px] leading-snug text-muted-foreground">{entry.description}</span>
      </span>
    </button>
  );
}

export function NodePalette() {
  return (
    <div className="flex flex-col gap-3 p-3 pb-6">
      <div>
        <h3 className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Add node
        </h3>
      </div>

      {SECTIONS.map((section) => (
        <details key={section.id} open>
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-1 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/80 text-muted-foreground">
              {section.icon}
            </span>
            {section.title}
          </summary>
          <div className="mt-1.5 flex flex-col gap-1 border-l border-border/60 pl-2.5">
            {section.entries.map((entry) => (
              <PaletteButton key={`${section.id}-${entry.kind}`} entry={entry} />
            ))}
          </div>
        </details>
      ))}

      {/* <p className="px-1 text-[10px] leading-snug text-muted-foreground">
        Voiceflow <strong>MCP</strong> or catalog integrations are not wired natively — expose them with{" "}
        <strong>API Call</strong> to your own bridge.
      </p> */}
    </div>
  );
}
