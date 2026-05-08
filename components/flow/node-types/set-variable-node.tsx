"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Variable } from "lucide-react";
import { NodeShell } from "./node-shell";
import type { SetVariableNodeData } from "@/types/flow";

export function SetVariableNode(props: NodeProps) {
  const data = props.data as unknown as SetVariableNodeData;
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeShell
        id={props.id}
        title={data.label || "Set Variable"}
        accent="bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-100"
        icon={<Variable className="h-3.5 w-3.5" />}
      >
        <ul className="space-y-1 text-xs">
          {(data.assignments ?? []).slice(0, 4).map((a) => (
            <li key={a.id} className="font-mono text-muted-foreground">
              {a.variable || "?"} = {a.value || ""}
            </li>
          ))}
        </ul>
      </NodeShell>
      <Handle type="source" position={Position.Right} />
    </>
  );
}
