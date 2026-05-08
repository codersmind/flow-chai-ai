import "server-only";
import { nanoid } from "nanoid";
import type { NodeExecutor } from "../registry";
import { nextDefaultTarget } from "../runtime-context";
import { interpolateVariables } from "@/lib/utils";
import type { MessageNodeData } from "@/types/flow";

export const messageExecutor: NodeExecutor = async (node, ctx) => {
  const data = node.data as MessageNodeData;
  const message = interpolateVariables(data.message ?? "", ctx.variables);
  if (message.trim()) {
    await ctx.emit({
      kind: "message",
      message: {
        id: `msg_${nanoid(8)}`,
        role: "assistant",
        content: message,
        createdAt: Date.now(),
        nodeId: node.id,
      },
    });
  }
  return {
    nextNodeId: nextDefaultTarget(ctx.input.graph, node.id),
  };
};
