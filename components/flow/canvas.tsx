"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  ConnectionLineType,
  type Node,
  type Edge,
  type ReactFlowInstance,
} from "@xyflow/react";
import { nodeTypes } from "./node-types";
import { useCanvasStore } from "@/stores/canvas-store";
import type { NodeKind } from "@/types/flow";
import { toast } from "sonner";

interface FlowCanvasProps {
  flowId: string;
  /** `flows.updated_at` from the server — when it changes and the canvas is clean, reload graph from props. */
  graphRevision?: number;
  initialNodes: Node[];
  initialEdges: Edge[];
  onNodeDoubleClick?: () => void;
  onPaneClick?: () => void;
}

function FlowCanvasInner({
  flowId,
  graphRevision,
  initialNodes,
  initialEdges,
  onNodeDoubleClick,
  onPaneClick,
}: FlowCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rfInstanceRef = useRef<ReactFlowInstance | null>(null);

  const {
    nodes,
    edges,
    initialize,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onReconnect,
    setSelectedNode,
    addNode,
    dirty,
    clearDirty,
    undo,
    redo,
    flowId: storedId,
    lastSyncedGraphRevision,
    clearCanvasSelection,
  } = useCanvasStore();

  useEffect(() => {
    if (storedId !== flowId) {
      initialize(flowId, initialNodes, initialEdges, graphRevision ?? null);
      return;
    }
    if (
      graphRevision != null &&
      lastSyncedGraphRevision != null &&
      graphRevision > lastSyncedGraphRevision &&
      !dirty
    ) {
      initialize(flowId, initialNodes, initialEdges, graphRevision);
    }
  }, [
    flowId,
    graphRevision,
    storedId,
    dirty,
    lastSyncedGraphRevision,
    initialNodes,
    initialEdges,
    initialize,
  ]);

  // Autosave
  useEffect(() => {
    if (!dirty || !storedId) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/flows/${storedId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            graph: {
              nodes: nodes.map((n) => ({
                id: n.id,
                type: n.type as NodeKind,
                position: n.position,
                data: n.data,
              })),
              edges: edges.map((e) => ({
                id: e.id,
                type: e.type,
                source: e.source,
                target: e.target,
                sourceHandle: e.sourceHandle ?? null,
                targetHandle: e.targetHandle ?? null,
                label: typeof e.label === "string" ? e.label : undefined,
              })),
            },
          }),
        });
        if (!res.ok) throw new Error(`Save failed (${res.status})`);
        const payload = (await res.json()) as { flow?: { updatedAt?: number } };
        clearDirty();
        if (typeof payload.flow?.updatedAt === "number") {
          useCanvasStore.setState({ lastSyncedGraphRevision: payload.flow.updatedAt });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Save failed";
        toast.error(message);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [nodes, edges, dirty, storedId, clearDirty]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = e.target;
      if (
        el instanceof HTMLElement &&
        (el.matches("input, textarea, select, [contenteditable='true']") ||
          el.closest('[role="dialog"]') ||
          el.closest('[role="combobox"]') ||
          el.closest('[role="tab"]') ||
          el.closest("[data-radix-popper-content-wrapper]"))
      ) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))
      ) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const kind = event.dataTransfer.getData("application/lvf-node") as NodeKind | "";
      if (!kind || !rfInstanceRef.current) return;
      const position = rfInstanceRef.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      addNode(kind, position);
    },
    [addNode]
  );

  return (
    <div ref={wrapperRef} className="h-full w-full" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={onReconnect}
        edgesReconnectable
        reconnectRadius={14}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: { strokeWidth: 1.75 },
        }}
        connectionLineType={ConnectionLineType.SmoothStep}
        onInit={(instance) => {
          rfInstanceRef.current = instance;
        }}
        onNodeClick={(_, node) => setSelectedNode(node.id)}
        onNodeDoubleClick={(_, node) => {
          setSelectedNode(node.id);
          onNodeDoubleClick?.();
        }}
        onPaneClick={() => {
          clearCanvasSelection();
          onPaneClick?.();
        }}
        fitView
        deleteKeyCode={["Backspace", "Delete"]}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} size={1} />
        <Controls />
        <MiniMap pannable zoomable className="!bg-card" />
      </ReactFlow>
    </div>
  );
}

export function FlowCanvas(props: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
