import "server-only";
import type { FlowGraph, FlowNode } from "@/types/flow";
import type { SimulatorEvent } from "@/types/trace";

export interface ExecutionInput {
  projectId: string;
  flowId: string;
  conversationId: string;
  graph: FlowGraph;
  variables: Record<string, unknown>;
  resumeFromNodeId?: string;
  userMessage?: string;
  maxSteps?: number;
}

export type EmitEvent = (event: SimulatorEvent) => void | Promise<void>;

export interface RuntimeContext {
  input: ExecutionInput;
  variables: Record<string, unknown>;
  emit: EmitEvent;
  steps: number;
  awaitingInput: boolean;
  pendingInputNodeId: string | null;
  endReason: string | null;
}

export interface ExecutorResult {
  nextNodeId: string | null;
  awaitInput?: boolean;
  end?: boolean;
  endReason?: string;
}

export function findNode(graph: FlowGraph, id: string): FlowNode | undefined {
  return graph.nodes.find((n) => n.id === id);
}

export function findStartNode(graph: FlowGraph): FlowNode | undefined {
  return graph.nodes.find((n) => n.type === "start");
}

export function getOutgoingEdges(graph: FlowGraph, nodeId: string) {
  return graph.edges.filter((e) => e.source === nodeId);
}

export function nextDefaultTarget(
  graph: FlowGraph,
  nodeId: string,
  sourceHandle?: string
): string | null {
  const edges = getOutgoingEdges(graph, nodeId);
  if (sourceHandle) {
    const handleEdge = edges.find((e) => e.sourceHandle === sourceHandle);
    if (handleEdge) return handleEdge.target;
  }
  const fallback = edges.find((e) => !e.sourceHandle);
  return fallback?.target ?? edges[0]?.target ?? null;
}
