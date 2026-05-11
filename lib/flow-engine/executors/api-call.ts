import "server-only";
import type { NodeExecutor } from "../registry";
import { nextDefaultTarget } from "../runtime-context";
import { interpolateVariables, safeJsonParse } from "@/lib/utils";
import type { ApiCallNodeData } from "@/types/flow";

export const apiCallExecutor: NodeExecutor = async (node, ctx) => {
  const data = node.data as ApiCallNodeData;
  const outputKey = (data.outputVariable ?? "").trim();
  const url = interpolateVariables(data.url ?? "", ctx.variables);
  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(data.headers ?? {})) {
    headers[k] = interpolateVariables(v, ctx.variables);
  }
  let body: string | undefined;
  if (data.method !== "GET" && data.body) {
    body = interpolateVariables(data.body, ctx.variables);
  }
  try {
    const res = await fetch(url, { method: data.method, headers, body });
    const text = await res.text();
    const parsed = safeJsonParse<unknown>(text, text);
    if (outputKey) {
      ctx.variables[outputKey] = parsed;
      await ctx.emit({ kind: "variable_set", variable: outputKey, value: parsed });
    }
    await ctx.emit({
      kind: "trace",
      trace: {
        id: `trc_${Date.now()}`,
        conversationId: ctx.input.conversationId,
        nodeId: node.id,
        nodeKind: "api_call",
        level: res.ok ? "info" : "warn",
        message: `${data.method} ${url} -> ${res.status}`,
        createdAt: Date.now(),
      },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "API call failed";
    await ctx.emit({
      kind: "trace",
      trace: {
        id: `trc_${Date.now()}`,
        conversationId: ctx.input.conversationId,
        nodeId: node.id,
        nodeKind: "api_call",
        level: "error",
        message: errorMessage,
        createdAt: Date.now(),
      },
    });
  }
  return { nextNodeId: nextDefaultTarget(ctx.input.graph, node.id) };
};
