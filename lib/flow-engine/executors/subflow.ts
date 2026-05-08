import "server-only";
import type { NodeExecutor } from "../registry";
import { nextDefaultTarget } from "../runtime-context";

export const subflowExecutor: NodeExecutor = async (node, ctx) => {
  await ctx.emit({
    kind: "trace",
    trace: {
      id: `trc_${Date.now()}`,
      conversationId: ctx.input.conversationId,
      nodeId: node.id,
      nodeKind: "subflow",
      level: "info",
      message: "Subflow node executed (inline; nested flow execution stub).",
      createdAt: Date.now(),
    },
  });
  return { nextNodeId: nextDefaultTarget(ctx.input.graph, node.id) };
};
