import "server-only";
import type { NodeExecutor } from "../registry";
import { nextDefaultTarget } from "../runtime-context";
import {
  getVariableAtPath,
  interpolateVariables,
  parseVariablePath,
} from "@/lib/utils";
import type { SetVariableNodeData } from "@/types/flow";

export const setVariableExecutor: NodeExecutor = async (node, ctx) => {
  const data = node.data as SetVariableNodeData;
  for (const a of data.assignments ?? []) {
    const key = (a.variable ?? "").trim();
    if (!key) continue;
    const rawTemplate = (a.value ?? "").trim();
    const singleRef = rawTemplate.match(/^\{\{\s*([\s\S]*?)\s*\}\}$/);
    let value: unknown = interpolateVariables(a.value ?? "", ctx.variables);
    if (singleRef) {
      const path = parseVariablePath(singleRef[1]);
      if (path) {
        const cur = getVariableAtPath(ctx.variables, path);
        if (cur !== undefined) value = cur;
      }
    }
    ctx.variables[key] = value;
    await ctx.emit({ kind: "variable_set", variable: key, value });
  }
  return { nextNodeId: nextDefaultTarget(ctx.input.graph, node.id) };
};
