import "server-only";
import type { NodeExecutor } from "../registry";
import { nextDefaultTarget } from "../runtime-context";

export const commentExecutor: NodeExecutor = async (node, ctx) => {
  return { nextNodeId: nextDefaultTarget(ctx.input.graph, node.id) };
};
