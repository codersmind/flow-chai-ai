import "server-only";
import { nanoid } from "nanoid";
import type { NodeExecutor } from "../registry";
import { nextDefaultTarget } from "../runtime-context";
import { interpolateVariables } from "@/lib/utils";
import type { ExprFunctionNodeData } from "@/types/flow";
import jexl from "jexl";

/** Flatten variables into a JEXL-safe context (identifiers + JSON-cloned objects). */
function buildJexlContext(vars: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  let count = 0;
  for (const [k, v] of Object.entries(vars)) {
    if (count++ > 80) break;
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k)) continue;
    if (v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
    } else {
      try {
        out[k] = JSON.parse(JSON.stringify(v));
      } catch {
        /* skip non-serializable */
      }
    }
  }
  return out;
}

export const exprFunctionExecutor: NodeExecutor = async (node, ctx) => {
  const data = node.data as ExprFunctionNodeData;
  const exprRaw = data.expression ?? "";
  const expr = interpolateVariables(exprRaw, ctx.variables).trim();
  const outKey = (data.outputVariable ?? "").trim();

  if (!expr) {
    await ctx.emit({
      kind: "trace",
      trace: {
        id: `trc_${nanoid(8)}`,
        conversationId: ctx.input.conversationId,
        nodeId: node.id,
        nodeKind: "function",
        level: "warn",
        message: "Function node: empty expression after {{}} interpolation.",
        createdAt: Date.now(),
      },
    });
    return { nextNodeId: nextDefaultTarget(ctx.input.graph, node.id) };
  }

  const context = buildJexlContext(ctx.variables);

  try {
    const result = await Promise.resolve(jexl.eval(expr, context));
    if (outKey) {
      ctx.variables[outKey] = result;
      await ctx.emit({ kind: "variable_set", variable: outKey, value: result });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await ctx.emit({
      kind: "trace",
      trace: {
        id: `trc_${nanoid(8)}`,
        conversationId: ctx.input.conversationId,
        nodeId: node.id,
        nodeKind: "function",
        level: "error",
        message: `JEXL error: ${msg}`,
        payload: { expression: expr.slice(0, 500) },
        createdAt: Date.now(),
      },
    });
  }

  return { nextNodeId: nextDefaultTarget(ctx.input.graph, node.id) };
};
