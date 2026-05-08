import "server-only";
import type { NodeExecutor } from "../registry";

export const endExecutor: NodeExecutor = async () => {
  return { nextNodeId: null, end: true, endReason: "end_node" };
};
