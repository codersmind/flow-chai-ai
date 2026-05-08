"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Mic } from "lucide-react";
import { NodeShell } from "./node-shell";
import type { CaptureNodeData } from "@/types/flow";

export function CaptureNode(props: NodeProps) {
  const data = props.data as unknown as CaptureNodeData;
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeShell
        id={props.id}
        title={data.label || "Capture"}
        subtitle={data.variable ? `→ {{${data.variable}}}` : undefined}
        accent="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
        icon={<Mic className="h-3.5 w-3.5" />}
      >
        <p className="line-clamp-2 text-xs text-muted-foreground">{data.prompt || "(no prompt)"}</p>
      </NodeShell>
      <Handle type="source" position={Position.Right} />
    </>
  );
}
