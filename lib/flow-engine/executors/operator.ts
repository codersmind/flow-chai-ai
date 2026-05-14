import "server-only";
import type { NodeExecutor } from "../registry";
import { nextDefaultTarget } from "../runtime-context";
import { interpolateVariables } from "@/lib/utils";
import type { OperatorNodeData, OperatorStep, OperatorStepOp } from "@/types/flow";

function num(s: string): number {
  const n = Number(String(s).trim());
  return Number.isFinite(n) ? n : 0;
}

function applyStep(step: OperatorStep, ctx: { variables: Record<string, unknown> }): unknown {
  const key = (step.targetVariable ?? "").trim();
  if (!key) return undefined;
  const args = (step.args ?? []).map((a) => interpolateVariables(a ?? "", ctx.variables));
  const op = step.op as OperatorStepOp;

  switch (op) {
    case "set":
      return args[0] ?? "";
    case "append": {
      const cur = String(ctx.variables[key] ?? "");
      return cur + String(args[0] ?? "");
    }
    case "add":
      return num(args[0]) + num(args[1]);
    case "subtract":
      return num(args[0]) - num(args[1]);
    case "multiply":
      return num(args[0]) * num(args[1]);
    case "divide": {
      const b = num(args[1]);
      return b === 0 ? 0 : num(args[0]) / b;
    }
    case "uppercase":
      return String(args[0] ?? "").toUpperCase();
    case "lowercase":
      return String(args[0] ?? "").toLowerCase();
    case "trim":
      return String(args[0] ?? "").trim();
    case "replace": {
      const base = String(args[0] ?? "");
      const find = String(args[1] ?? "");
      const rep = String(args[2] ?? "");
      if (!find) return base;
      return base.split(find).join(rep);
    }
    default:
      return ctx.variables[key];
  }
}

export const operatorExecutor: NodeExecutor = async (node, ctx) => {
  const data = node.data as OperatorNodeData;
  for (const step of data.steps ?? []) {
    const key = (step.targetVariable ?? "").trim();
    if (!key) continue;
    const value = applyStep(step, ctx);
    ctx.variables[key] = value;
    await ctx.emit({ kind: "variable_set", variable: key, value });
  }
  return { nextNodeId: nextDefaultTarget(ctx.input.graph, node.id) };
};
