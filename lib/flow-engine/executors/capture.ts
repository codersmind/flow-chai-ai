import "server-only";
import { nanoid } from "nanoid";
import type { NodeExecutor } from "../registry";
import { nextDefaultTarget } from "../runtime-context";
import { interpolateVariables } from "@/lib/utils";
import type { CaptureNodeData } from "@/types/flow";

/** Pull a short name from common self-intro phrases (case-insensitive). */
export function extractDisplayNameFromReply(raw: string): string {
  const t = raw.trim();
  const patterns = [
    /^i\s*am\s+(.+)$/i,
    /^i['']m\s+(.+)$/i,
    /^my\s+name\s+is\s+(.+)$/i,
    /^call\s+me\s+(.+)$/i,
    /^this\s+is\s+(.+)$/i,
    /^name\s*:\s*(.+)$/i,
    /^it['']s\s+(.+)$/i,
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return t;
}

export const captureExecutor: NodeExecutor = async (node, ctx) => {
  const data = node.data as CaptureNodeData;
  if (ctx.input.resumeFromNodeId === node.id && ctx.input.userMessage !== undefined) {
    const raw = ctx.input.userMessage;
    const value =
      data.extractDisplayName === true ? extractDisplayNameFromReply(raw) : raw;
    if (data.variable) {
      ctx.variables[data.variable] = value;
      await ctx.emit({ kind: "variable_set", variable: data.variable, value });
    }
    return {
      nextNodeId: nextDefaultTarget(ctx.input.graph, node.id),
    };
  }

  const prompt = interpolateVariables(data.prompt ?? "", ctx.variables);
  if (prompt.trim()) {
    await ctx.emit({
      kind: "message",
      message: {
        id: `msg_${nanoid(8)}`,
        role: "assistant",
        content: prompt,
        createdAt: Date.now(),
        nodeId: node.id,
      },
    });
  }
  const suggestionChips = (data.suggestedReplies ?? [])
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  await ctx.emit({
    kind: "request_input",
    nodeId: node.id,
    prompt,
    suggestedReplies: suggestionChips,
  });
  ctx.awaitingInput = true;
  ctx.pendingInputNodeId = node.id;
  return { nextNodeId: null, awaitInput: true };
};
