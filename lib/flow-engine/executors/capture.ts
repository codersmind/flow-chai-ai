import "server-only";
import { nanoid } from "nanoid";
import type { NodeExecutor } from "../registry";
import { nextDefaultTarget } from "../runtime-context";
import { interpolateVariables } from "@/lib/utils";
import type { CaptureNodeData } from "@/types/flow";

export const captureExecutor: NodeExecutor = async (node, ctx) => {
  const data = node.data as CaptureNodeData;
  if (ctx.input.resumeFromNodeId === node.id && ctx.input.userMessage !== undefined) {
    const value = ctx.input.userMessage;
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
  await ctx.emit({
    kind: "request_input",
    prompt,
    suggestedReplies: data.suggestedReplies ?? [],
  });
  ctx.awaitingInput = true;
  ctx.pendingInputNodeId = node.id;
  return { nextNodeId: null, awaitInput: true };
};
