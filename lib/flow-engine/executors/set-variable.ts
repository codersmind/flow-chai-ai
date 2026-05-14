import "server-only";
import type { NodeExecutor } from "../registry";
import { nextDefaultTarget } from "../runtime-context";
import {
  getVariableAtPath,
  interpolateVariables,
  parseVariablePath,
} from "@/lib/utils";
import type { SetVariableAssignment, SetVariableNodeData } from "@/types/flow";
import { extractValueWithAi } from "@/lib/flow-engine/ai-extract-value";

function resolveValueCleanup(a: SetVariableAssignment): SetVariableAssignment["valueCleanup"] {
  const v = a.valueCleanup as SetVariableAssignment["valueCleanup"] | undefined;
  if (v === "ai" || v === "none") return v;
  return "none";
}

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

    if (resolveValueCleanup(a) === "ai" && typeof value === "string") {
      const src = value.trim();
      if (src.length > 0) {
        const question = `Flow step: set variable ${JSON.stringify(key)} from a template or from the user's latest reply (e.g. {{last_utterance}}). Extract only the value meant for ${JSON.stringify(key)}.`;
        value = await extractValueWithAi(src, {
          variable: key,
          question,
          transcript: ctx.input.conversationTranscript,
          variables: ctx.variables,
        });
      }
    }

    ctx.variables[key] = value;
    await ctx.emit({ kind: "variable_set", variable: key, value });
  }
  return { nextNodeId: nextDefaultTarget(ctx.input.graph, node.id) };
};
