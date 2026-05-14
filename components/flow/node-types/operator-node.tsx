"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Calculator } from "lucide-react";
import { NodeShell } from "./node-shell";
import type { OperatorNodeData } from "@/types/flow";

export function OperatorNode(props: NodeProps) {
  const data = props.data as unknown as OperatorNodeData;
  const n = (data.steps ?? []).length;
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeShell
        id={props.id}
        title={data.label || "Operator"}
        accent="bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-100"
        icon={<Calculator className="h-3.5 w-3.5" />}
      >
        <p className="text-xs text-muted-foreground">
          {n} step{n === 1 ? "" : "s"} (math / string / replace)
        </p>
      </NodeShell>
      <Handle type="source" position={Position.Right} />
    </>
  );
}
