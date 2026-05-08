import "server-only";
import type { NodeExecutor } from "../registry";
import { nextDefaultTarget } from "../runtime-context";

export const startExecutor: NodeExecutor = async (node, ctx) => {
  return {
    nextNodeId: nextDefaultTarget(ctx.input.graph, node.id),
  };
};
