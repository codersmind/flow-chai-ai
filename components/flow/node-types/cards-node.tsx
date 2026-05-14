"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { LayoutGrid } from "lucide-react";
import { NodeShell } from "./node-shell";
import type { CardsNodeData } from "@/types/flow";

export function CardsNode(props: NodeProps) {
  const data = props.data as unknown as CardsNodeData;
  const n = (data.cards ?? []).length;
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeShell
        id={props.id}
        title={data.label || "Cards"}
        accent="bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-950 dark:text-fuchsia-100"
        icon={<LayoutGrid className="h-3.5 w-3.5" />}
      >
        <p className="text-xs text-muted-foreground">
          {n} card{n === 1 ? "" : "s"} · {data.layout === "carousel" ? "Carousel" : "Stack"}
        </p>
      </NodeShell>
      <Handle type="source" position={Position.Right} />
    </>
  );
}
