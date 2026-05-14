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
  /**
   * Recent simulator turns (from client). Lets AI extract resolve "same as before" / "I already told you"
   * using earlier user lines.
   */
  conversationTranscript?: { role: "user" | "assistant" | "system"; content: string }[];
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

/**
 * Resolves the next node along an outgoing edge.
 * When `sourceHandle` is provided (Condition / Choice), only an edge whose `sourceHandle`
 * matches is used — we intentionally do **not** fall back to another handle, which used
 * to always pick the first edge and made branching look "broken".
 */
export function nextDefaultTarget(
  graph: FlowGraph,
  nodeId: string,
  sourceHandle?: string | null
): string | null {
  const edges = getOutgoingEdges(graph, nodeId);
  if (!edges.length) return null;

  const handle =
    typeof sourceHandle === "string" && sourceHandle.trim().length > 0
      ? sourceHandle.trim()
      : "";

  if (handle) {
    const handleEdge = edges.find((e) => {
      const h = e.sourceHandle;
      if (h === undefined || h === null) return false;
      return String(h) === handle;
    });
    return handleEdge?.target ?? null;
  }

  const fallback = edges.find(
    (e) => e.sourceHandle === undefined || e.sourceHandle === null
  );
  if (fallback) return fallback.target;
  return edges[0]?.target ?? null;
}
