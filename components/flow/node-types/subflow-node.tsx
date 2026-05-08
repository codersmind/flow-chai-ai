"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Workflow } from "lucide-react";
import { NodeShell } from "./node-shell";
import type { SubflowNodeData } from "@/types/flow";

export function SubflowNode(props: NodeProps) {
  const data = props.data as unknown as SubflowNodeData;
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeShell
        id={props.id}
        title={data.label || "Subflow"}
        accent="bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-100"
        icon={<Workflow className="h-3.5 w-3.5" />}
      >
        <p className="text-xs text-muted-foreground">
          flow: <span className="font-mono">{data.flowId || "(unset)"}</span>
        </p>
      </NodeShell>
      <Handle type="source" position={Position.Right} />
    </>
  );
}
