import "server-only";
import { nanoid } from "nanoid";
import type { NodeExecutor } from "../registry";
import { nextDefaultTarget, type RuntimeContext } from "../runtime-context";
import { interpolateVariables } from "@/lib/utils";
import type { CaptureNameCleanup, CaptureNodeData } from "@/types/flow";
import { extractValueWithAi } from "@/lib/flow-engine/ai-extract-value";

export { extractDisplayNameFromReply } from "@/lib/flow-engine/ai-extract-value";

function resolveCleanupMode(data: CaptureNodeData): CaptureNameCleanup {
  const raw = data.nameCleanup as CaptureNameCleanup | "patterns" | undefined;
  if (raw === "patterns") return "ai";
  if (raw === "ai" || raw === "none") return raw;
  if (data.extractDisplayName === true) return "ai";
  return "none";
}

async function reduceCapturedValue(
  raw: string,
  data: CaptureNodeData,
  questionShown: string,
  ctx: RuntimeContext
): Promise<string> {
  const mode = resolveCleanupMode(data);
  if (mode === "none") return raw;
  return extractValueWithAi(raw, {
    variable: data.variable ?? "",
    question: questionShown,
    transcript: ctx.input.conversationTranscript,
    variables: ctx.variables,
  });
}

export const captureExecutor: NodeExecutor = async (node, ctx) => {
  const data = node.data as CaptureNodeData;
  if (ctx.input.resumeFromNodeId === node.id && ctx.input.userMessage !== undefined) {
    const raw = ctx.input.userMessage;
    const varKey = (data.variable ?? "").trim().toLowerCase();

    ctx.variables.last_user_message = raw;
    await ctx.emit({ kind: "variable_set", variable: "last_user_message", value: raw });

    /** Raw line for Set {{last_utterance}} → {{customer_name}} (Voiceflow Listen + Set). */
    if (varKey !== "last_utterance") {
      ctx.variables.last_utterance = raw;
      await ctx.emit({ kind: "variable_set", variable: "last_utterance", value: raw });
    }

    const questionShown = interpolateVariables(data.prompt ?? "", ctx.variables);
    const value = await reduceCapturedValue(raw, data, questionShown, ctx);
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
