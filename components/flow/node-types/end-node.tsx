"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Square } from "lucide-react";
import { NodeShell } from "./node-shell";

export function EndNode(props: NodeProps) {
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeShell
        id={props.id}
        title="End"
        accent="bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
        icon={<Square className="h-3.5 w-3.5" />}
      >
        <p className="text-xs text-muted-foreground">Conversation ends</p>
      </NodeShell>
    </>
  );
}
