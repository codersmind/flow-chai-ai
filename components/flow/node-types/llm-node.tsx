"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Sparkles } from "lucide-react";
import { NodeShell } from "./node-shell";
import type { LlmNodeData } from "@/types/flow";

export function LlmNode(props: NodeProps) {
  const data = props.data as unknown as LlmNodeData;
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeShell
        id={props.id}
        title={data.label || "LLM"}
        subtitle={data.model ? `model: ${data.model}` : "default model"}
        accent="bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-100"
        icon={<Sparkles className="h-3.5 w-3.5" />}
      >
        <p className="line-clamp-3 whitespace-pre-wrap text-xs text-muted-foreground">
          {data.userPrompt || "(no prompt)"}
        </p>
        {data.outputVariable ? (
          <p className="mt-2 text-xs">
            → <span className="font-mono">{`{{${data.outputVariable}}}`}</span>
          </p>
        ) : null}
      </NodeShell>
      <Handle type="source" position={Position.Right} />
    </>
  );
}
