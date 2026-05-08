import "server-only";
import { nanoid } from "nanoid";
import type { NodeExecutor } from "../registry";
import { nextDefaultTarget } from "../runtime-context";
import { interpolateVariables } from "@/lib/utils";
import type { ChoiceNodeData } from "@/types/flow";

export const choiceExecutor: NodeExecutor = async (node, ctx) => {
  const data = node.data as ChoiceNodeData;

  if (ctx.input.resumeFromNodeId === node.id && ctx.input.userMessage !== undefined) {
    const userInput = (ctx.input.userMessage || "").trim().toLowerCase();
    let matchedHandle: string | undefined;
    for (const opt of data.options) {
      if (opt.label.trim().toLowerCase() === userInput || opt.id === ctx.input.userMessage) {
        matchedHandle = opt.id;
        break;
      }
    }
    if (!matchedHandle) {
      const partial = data.options.find((o) =>
        o.label.toLowerCase().includes(userInput) && userInput.length > 0
      );
      matchedHandle = partial?.id;
    }
    return {
      nextNodeId: nextDefaultTarget(ctx.input.graph, node.id, matchedHandle),
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
    choices: data.options ?? [],
  });
  ctx.awaitingInput = true;
  ctx.pendingInputNodeId = node.id;
  return { nextNodeId: null, awaitInput: true };
};
