"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Search } from "lucide-react";
import { NodeShell } from "./node-shell";
import type { KbSearchNodeData } from "@/types/flow";

export function KbSearchNode(props: NodeProps) {
  const data = props.data as unknown as KbSearchNodeData;
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeShell
        id={props.id}
        title={data.label || "KB Search"}
        accent="bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-100"
        icon={<Search className="h-3.5 w-3.5" />}
      >
        <p className="text-xs text-muted-foreground line-clamp-2">{data.query}</p>
        <p className="mt-1 text-xs">
          top {data.topK} → <span className="font-mono">{`{{${data.outputVariable}}}`}</span>
        </p>
      </NodeShell>
      <Handle type="source" position={Position.Right} />
    </>
  );
}
