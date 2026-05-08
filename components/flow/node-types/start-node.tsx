"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Play } from "lucide-react";
import { NodeShell } from "./node-shell";

export function StartNode(props: NodeProps) {
  return (
    <>
      <NodeShell
        id={props.id}
        title="Start"
        accent="bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
        icon={<Play className="h-3.5 w-3.5" />}
      >
        <p className="text-xs text-muted-foreground">Entry point</p>
      </NodeShell>
      <Handle type="source" position={Position.Right} />
    </>
  );
}
