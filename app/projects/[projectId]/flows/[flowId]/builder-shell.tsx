"use client";

import Link from "next/link";
import type { Node, Edge } from "@xyflow/react";
import { FlowCanvas } from "@/components/flow/canvas";
import { NodePalette } from "@/components/flow/palette";
import { FlowInspector } from "@/components/flow/inspector";
import { SimulatorPanel } from "@/components/simulator/simulator-panel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Workflow } from "lucide-react";

interface BuilderShellProps {
  projectId: string;
  flowId: string;
  flowName: string;
  flows: { id: string; name: string }[];
  initialNodes: Node[];
  initialEdges: Edge[];
}

export function BuilderShell({
  projectId,
  flowId,
  flowName,
  flows,
  initialNodes,
  initialEdges,
}: BuilderShellProps) {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-12 items-center justify-between border-b bg-background/95 px-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button asChild size="sm" variant="ghost">
            <Link href={`/projects/${projectId}`}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Workflow className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">{flowName}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {flows.length > 1 ? (
            <select
              defaultValue={flowId}
              onChange={(e) => {
                const id = e.target.value;
                if (id !== flowId) {
                  window.location.href = `/projects/${projectId}/flows/${id}`;
                }
              }}
              className="rounded border bg-background px-2 py-1 text-xs"
            >
              {flows.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          ) : null}
          <span>Auto-saving on change</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 shrink-0 overflow-y-auto border-r bg-muted/20">
          <NodePalette />
        </aside>

        <main className="flex-1 overflow-hidden">
          <FlowCanvas flowId={flowId} initialNodes={initialNodes} initialEdges={initialEdges} />
        </main>

        <aside className="flex w-80 shrink-0 flex-col border-l">
          <FlowInspector />
        </aside>

        <aside className="flex w-96 shrink-0 flex-col border-l">
          <SimulatorPanel flowId={flowId} />
        </aside>
      </div>
    </div>
  );
}
