import "server-only";
import type { NodeExecutor } from "../registry";
import { nextDefaultTarget } from "../runtime-context";
import { interpolateVariables } from "@/lib/utils";
import type { KbSearchNodeData } from "@/types/flow";
import { retrieveTopK } from "@/lib/rag/retrieval";

export const kbSearchExecutor: NodeExecutor = async (node, ctx) => {
  const data = node.data as KbSearchNodeData;
  const query = interpolateVariables(data.query ?? "", ctx.variables);
  try {
    const hits = await retrieveTopK(ctx.input.projectId, query, data.topK ?? 4);
    const joined = hits.map((h, i) => `[#${i + 1}] (score=${h.score.toFixed(3)}) ${h.content}`).join("\n\n");
    if (data.outputVariable) {
      ctx.variables[data.outputVariable] = joined;
      await ctx.emit({ kind: "variable_set", variable: data.outputVariable, value: joined });
    }
    await ctx.emit({
      kind: "trace",
      trace: {
        id: `trc_${Date.now()}`,
        conversationId: ctx.input.conversationId,
        nodeId: node.id,
        nodeKind: "kb_search",
        level: "info",
        message: `KB returned ${hits.length} hits for "${query.slice(0, 80)}"`,
        createdAt: Date.now(),
      },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "KB search failed";
    await ctx.emit({
      kind: "trace",
      trace: {
        id: `trc_${Date.now()}`,
        conversationId: ctx.input.conversationId,
        nodeId: node.id,
        nodeKind: "kb_search",
        level: "error",
        message: errorMessage,
        createdAt: Date.now(),
      },
    });
  }
  return { nextNodeId: nextDefaultTarget(ctx.input.graph, node.id) };
};
