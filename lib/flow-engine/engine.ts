import "server-only";
import {
  ExecutionInput,
  RuntimeContext,
  findNode,
  findStartNode,
} from "./runtime-context";
import { ensureExecutorsRegistered } from "./executors";
import { getExecutor } from "./registry";
import type { SimulatorEvent } from "@/types/trace";

export interface ExecuteFlowOptions extends ExecutionInput {
  onEvent: (event: SimulatorEvent) => void | Promise<void>;
}

export async function executeFlow(options: ExecuteFlowOptions): Promise<{
  variables: Record<string, unknown>;
  awaitingNodeId: string | null;
  endReason: string | null;
}> {
  ensureExecutorsRegistered();
  const ctx: RuntimeContext = {
    input: options,
    variables: { ...options.variables },
    emit: options.onEvent,
    steps: 0,
    awaitingInput: false,
    pendingInputNodeId: null,
    endReason: null,
  };

  let currentNodeId: string | null;
  if (options.resumeFromNodeId) {
    currentNodeId = options.resumeFromNodeId;
  } else {
    const start = findStartNode(options.graph);
    if (!start) {
      await ctx.emit({ kind: "error", error: "No start node found in this flow." });
      return { variables: ctx.variables, awaitingNodeId: null, endReason: "no_start" };
    }
    currentNodeId = start.id;
  }

  const max = options.maxSteps ?? 50;
  while (currentNodeId && ctx.steps < max) {
    const node = findNode(options.graph, currentNodeId);
    if (!node) {
      await ctx.emit({ kind: "error", error: `Node not found: ${currentNodeId}` });
      break;
    }
    await ctx.emit({ kind: "node_enter", nodeId: node.id, nodeKind: node.type });
    const exec = getExecutor(node.type);
    if (!exec) {
      await ctx.emit({ kind: "error", error: `No executor for type: ${node.type}` });
      break;
    }
    try {
      const result = await exec(node, ctx);
      await ctx.emit({ kind: "node_exit", nodeId: node.id, nodeKind: node.type });
      if (result.end) {
        ctx.endReason = result.endReason ?? "ended";
        await ctx.emit({ kind: "end", reason: ctx.endReason });
        return {
          variables: ctx.variables,
          awaitingNodeId: null,
          endReason: ctx.endReason,
        };
      }
      if (result.awaitInput) {
        return {
          variables: ctx.variables,
          awaitingNodeId: ctx.pendingInputNodeId,
          endReason: null,
        };
      }
      currentNodeId = result.nextNodeId;
      ctx.steps += 1;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await ctx.emit({ kind: "error", error: errorMessage });
      break;
    }
  }

  if (ctx.steps >= max) {
    await ctx.emit({ kind: "trace", trace: {
      id: `trc_${Date.now()}`,
      conversationId: options.conversationId,
      nodeId: null,
      nodeKind: null,
      level: "warn",
      message: `Max steps (${max}) reached`,
      createdAt: Date.now(),
    }});
  }

  if (!currentNodeId && !ctx.awaitingInput) {
    await ctx.emit({ kind: "end", reason: "no_next_node" });
  }
  return {
    variables: ctx.variables,
    awaitingNodeId: ctx.awaitingInput ? ctx.pendingInputNodeId : null,
    endReason: ctx.awaitingInput ? null : "no_next_node",
  };
}
