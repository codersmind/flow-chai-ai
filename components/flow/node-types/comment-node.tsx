"use client";

import type { NodeProps } from "@xyflow/react";
import type { CommentNodeData } from "@/types/flow";
import { StickyNote } from "lucide-react";
import { useCanvasStore } from "@/stores/canvas-store";

export function CommentNode(props: NodeProps) {
  const data = props.data as unknown as CommentNodeData;
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  return (
    <div className="min-w-[200px] max-w-[260px] rounded-lg border-2 border-dashed border-amber-400 bg-amber-50 p-3 text-amber-900 shadow-sm dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
      <div className="mb-2 flex items-center gap-1 text-xs font-semibold">
        <StickyNote className="h-3.5 w-3.5" />
        Comment
      </div>
      <textarea
        value={data.text ?? ""}
        onChange={(e) => updateNodeData(props.id, { text: e.target.value })}
        className="w-full resize-none bg-transparent text-xs outline-none"
        placeholder="Write a note..."
        rows={3}
      />
    </div>
  );
}
