"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Globe } from "lucide-react";
import { NodeShell } from "./node-shell";
import type { ApiCallNodeData } from "@/types/flow";

export function ApiCallNode(props: NodeProps) {
  const data = props.data as unknown as ApiCallNodeData;
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeShell
        id={props.id}
        title={data.label || "API Call"}
        accent="bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-100"
        icon={<Globe className="h-3.5 w-3.5" />}
      >
        <p className="font-mono text-xs">
          <span className="font-semibold">{data.method}</span> {data.url}
        </p>
        {data.outputVariable ? (
          <p className="mt-1 text-xs">
            → <span className="font-mono">{`{{${data.outputVariable}}}`}</span>
          </p>
        ) : null}
      </NodeShell>
      <Handle type="source" position={Position.Right} />
    </>
  );
}
