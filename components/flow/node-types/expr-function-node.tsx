"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Braces } from "lucide-react";
import { NodeShell } from "./node-shell";
import type { ExprFunctionNodeData } from "@/types/flow";

export function ExprFunctionNode(props: NodeProps) {
  const data = props.data as unknown as ExprFunctionNodeData;
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeShell
        id={props.id}
        title={data.label || "Function"}
        accent="bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
        icon={<Braces className="h-3.5 w-3.5" />}
      >
        <p className="line-clamp-2 font-mono text-[10px] text-muted-foreground">
          {data.expression || "(no expression)"}
        </p>
        {data.outputVariable ? (
          <p className="mt-1 text-[10px] text-muted-foreground">
            → <span className="font-mono">{data.outputVariable}</span>
          </p>
        ) : null}
      </NodeShell>
      <Handle type="source" position={Position.Right} />
    </>
  );
}
