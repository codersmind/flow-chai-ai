"use client";

import Link from "next/link";
import { useState } from "react";
import type { Node, Edge } from "@xyflow/react";
import { FlowCanvas } from "@/components/flow/canvas";
import { NodePalette } from "@/components/flow/palette";
import { FlowInspector } from "@/components/flow/inspector";
import { SimulatorPanel } from "@/components/simulator/simulator-panel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PanelRightClose, PanelRightOpen, Workflow } from "lucide-react";

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
  const [inspectorOpen, setInspectorOpen] = useState(true);

  return (
    <div className="flex h-screen flex-col bg-transparent p-3">
      <header className="glass-panel mb-3 flex h-14 items-center justify-between rounded-2xl px-4">
        <div className="flex items-center gap-3">
          <Button asChild size="sm" variant="outline" className="rounded-xl">
            <Link href={`/projects/${projectId}`}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Workflow className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">{flowName}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl"
            onClick={() => setInspectorOpen((v) => !v)}
            title={inspectorOpen ? "Hide inspector" : "Show inspector"}
          >
            {inspectorOpen ? (
              <PanelRightClose className="mr-1 h-3.5 w-3.5" />
            ) : (
              <PanelRightOpen className="mr-1 h-3.5 w-3.5" />
            )}
            {inspectorOpen ? "Hide editor" : "Show editor"}
          </Button>
          {flows.length > 1 ? (
            <select
              defaultValue={flowId}
              onChange={(e) => {
                const id = e.target.value;
                if (id !== flowId) {
                  window.location.href = `/projects/${projectId}/flows/${id}`;
                }
              }}
              className="rounded-xl border bg-background/80 px-2 py-1 text-xs"
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

      <div className="flex flex-1 overflow-hidden gap-3">
        <aside className="glass-panel w-60 shrink-0 overflow-y-auto rounded-2xl">
          <NodePalette />
        </aside>

        <main className="glass-panel flex-1 overflow-hidden rounded-2xl">
          <FlowCanvas
            flowId={flowId}
            initialNodes={initialNodes}
            initialEdges={initialEdges}
            onNodeDoubleClick={() => setInspectorOpen(true)}
            onPaneClick={() => setInspectorOpen(false)}
          />
        </main>

        {inspectorOpen ? (
          <aside className="glass-panel flex w-80 shrink-0 flex-col overflow-hidden rounded-2xl">
            <FlowInspector />
          </aside>
        ) : null}

        <aside className="glass-panel flex w-96 shrink-0 flex-col overflow-hidden rounded-2xl">
          <SimulatorPanel flowId={flowId} />
        </aside>
      </div>
    </div>
  );
}
