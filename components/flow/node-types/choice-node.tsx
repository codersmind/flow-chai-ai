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
        <ul className="space-y-1.5 text-xs">
          {options.map((o) => (
            <li
              key={o.id}
              className="relative flex min-h-[2.25rem] items-center rounded-md border border-border bg-background py-1.5 pl-2.5 pr-2"
            >
              <span className="min-w-0 flex-1 pr-2 leading-snug">{o.label}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={o.id}
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
