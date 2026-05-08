"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ListChecks } from "lucide-react";
import { NodeShell } from "./node-shell";
import type { ChoiceNodeData } from "@/types/flow";

export function ChoiceNode(props: NodeProps) {
  const data = props.data as unknown as ChoiceNodeData;
  const options = data.options ?? [];
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeShell
        id={props.id}
        title={data.label || "Choice"}
        accent="bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-100"
        icon={<ListChecks className="h-3.5 w-3.5" />}
      >
        <p className="mb-2 text-xs text-muted-foreground line-clamp-2">{data.prompt}</p>
        <ul className="space-y-1 text-xs">
          {options.map((o, i) => (
            <li key={o.id} className="relative rounded border bg-background px-2 py-1">
              {o.label}
              <Handle
                type="source"
                position={Position.Right}
                id={o.id}
                style={{ top: 30 + i * 28 }}
              />
            </li>
          ))}
        </ul>
      </NodeShell>
    </>
  );
}
