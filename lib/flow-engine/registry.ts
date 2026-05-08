import "server-only";
import type { FlowNode, NodeKind } from "@/types/flow";
import type { ExecutorResult, RuntimeContext } from "./runtime-context";

export type NodeExecutor = (
  node: FlowNode,
  ctx: RuntimeContext
) => Promise<ExecutorResult>;

const registry = new Map<NodeKind, NodeExecutor>();

export function registerExecutor(kind: NodeKind, executor: NodeExecutor) {
  registry.set(kind, executor);
}

export function getExecutor(kind: NodeKind): NodeExecutor | undefined {
  return registry.get(kind);
}
