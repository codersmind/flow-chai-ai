"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { GitBranch } from "lucide-react";
import { NodeShell } from "./node-shell";
import type { ConditionNodeData } from "@/types/flow";

export function ConditionNode(props: NodeProps) {
  const data = props.data as unknown as ConditionNodeData;
  const routes = data.routes ?? [];
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeShell
        id={props.id}
        title={data.label || (data.mode === "llm_router" ? "LLM Router" : "Condition")}
        accent="bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-100"
        icon={<GitBranch className="h-3.5 w-3.5" />}
      >
        <p className="mb-2 text-xs text-muted-foreground">
          {data.mode === "llm_router" ? "LLM router" : `${(data.rules ?? []).length} rule(s)`}
        </p>
        <ul className="space-y-1 text-xs">
          {routes.map((r, i) => (
            <li key={r.id} className="relative rounded border bg-background px-2 py-1">
              {r.label}
              <Handle
                type="source"
                position={Position.Right}
                id={r.id}
                style={{ top: 30 + i * 28 }}
              />
            </li>
          ))}
        </ul>
      </NodeShell>
    </>
  );
}
