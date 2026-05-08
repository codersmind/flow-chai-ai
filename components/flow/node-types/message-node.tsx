"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { MessageCircle } from "lucide-react";
import { NodeShell } from "./node-shell";
import type { MessageNodeData } from "@/types/flow";

export function MessageNode(props: NodeProps) {
  const data = props.data as unknown as MessageNodeData;
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeShell
        id={props.id}
        title={data.label || "Message"}
        accent="bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-100"
        icon={<MessageCircle className="h-3.5 w-3.5" />}
      >
        <p className="line-clamp-3 whitespace-pre-wrap text-xs text-muted-foreground">
          {data.message || "(empty)"}
        </p>
      </NodeShell>
      <Handle type="source" position={Position.Right} />
    </>
  );
}
