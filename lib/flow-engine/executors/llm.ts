import "server-only";
import { nanoid } from "nanoid";
import type { NodeExecutor } from "../registry";
import { nextDefaultTarget } from "../runtime-context";
import { interpolateVariables } from "@/lib/utils";
import type { LlmNodeData } from "@/types/flow";
import { generateOllama } from "@/lib/ai/stream";

export const llmExecutor: NodeExecutor = async (node, ctx) => {
  const data = node.data as LlmNodeData;
  const system = interpolateVariables(data.systemPrompt ?? "", ctx.variables);
  const userPrompt = interpolateVariables(data.userPrompt ?? "", ctx.variables);
  const startedAt = Date.now();
  await ctx.emit({
    kind: "trace",
    trace: {
      id: `trc_${Date.now()}`,
      conversationId: ctx.input.conversationId,
      nodeId: node.id,
      nodeKind: "llm",
      level: "info",
      message: "LLM request started",
      createdAt: Date.now(),
    },
  });
  try {
    const text = await generateOllama({
      systemPrompt: system || undefined,
      prompt: userPrompt,
      model: data.model,
      temperature: data.temperature,
      jsonMode: data.jsonMode,
      maxTokens: 220,
      timeoutMs: 45000,
    });
    await ctx.emit({
      kind: "trace",
      trace: {
        id: `trc_${Date.now()}`,
        conversationId: ctx.input.conversationId,
        nodeId: node.id,
        nodeKind: "llm",
        level: "info",
        message: `LLM response received in ${Date.now() - startedAt}ms`,
        createdAt: Date.now(),
      },
    });
    if (data.outputVariable) {
      ctx.variables[data.outputVariable] = text;
      await ctx.emit({ kind: "variable_set", variable: data.outputVariable, value: text });
    }
    // Always show the LLM output in simulator chat for clear UX/debugging.
    await ctx.emit({
      kind: "message",
      message: {
        id: `msg_${nanoid(8)}`,
        role: "assistant",
        content: text,
        createdAt: Date.now(),
        nodeId: node.id,
      },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "LLM call failed";
    await ctx.emit({
      kind: "trace",
      trace: {
        id: `trc_${Date.now()}`,
        conversationId: ctx.input.conversationId,
        nodeId: node.id,
        nodeKind: "llm",
        level: "error",
        message: errorMessage,
        createdAt: Date.now(),
      },
    });
    await ctx.emit({
      kind: "message",
      message: {
        id: `msg_${nanoid(8)}`,
        role: "assistant",
        content: `[LLM error: ${errorMessage}]`,
        createdAt: Date.now(),
        nodeId: node.id,
      },
    });
  }
  return { nextNodeId: nextDefaultTarget(ctx.input.graph, node.id) };
};
