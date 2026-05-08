import "server-only";
import type { NodeExecutor } from "../registry";
import { nextDefaultTarget } from "../runtime-context";
import { interpolateVariables } from "@/lib/utils";
import type { SetVariableNodeData } from "@/types/flow";

export const setVariableExecutor: NodeExecutor = async (node, ctx) => {
  const data = node.data as SetVariableNodeData;
  for (const a of data.assignments ?? []) {
    if (!a.variable) continue;
    const value = interpolateVariables(a.value ?? "", ctx.variables);
    ctx.variables[a.variable] = value;
    await ctx.emit({ kind: "variable_set", variable: a.variable, value });
  }
  return { nextNodeId: nextDefaultTarget(ctx.input.graph, node.id) };
};
