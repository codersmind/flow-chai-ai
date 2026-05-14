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
        <ul className="space-y-1.5 text-xs">
          {routes.map((r) => (
            <li
              key={r.id}
              className="relative flex min-h-[2.25rem] items-center rounded-md border border-border bg-background py-1.5 pl-2.5 pr-2"
            >
              <span className="min-w-0 flex-1 pr-2 leading-snug">{r.label}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={r.id}
                className="!absolute !left-auto top-1/2 h-2.5 w-2.5 -translate-y-1/2"
                style={{ right: -6 }}
              />
            </li>
          ))}
        </ul>
      </NodeShell>
    </>
  );
}
