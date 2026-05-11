import "server-only";
import type { NodeExecutor } from "../registry";
import { nextDefaultTarget } from "../runtime-context";
import { interpolateVariables } from "@/lib/utils";
import type { ConditionNodeData, ConditionRule } from "@/types/flow";
import { generateOllama } from "@/lib/ai/stream";

function evaluateRule(rule: ConditionRule, variables: Record<string, unknown>): boolean {
  const raw = variables[rule.variable];
  const left = raw === undefined || raw === null ? "" : String(raw);
  const right = rule.value ?? "";
  switch (rule.operator) {
    case "equals":
      return left === right;
    case "not_equals":
      return left !== right;
    case "contains":
      return left.toLowerCase().includes(right.toLowerCase());
    case "gt":
      return Number(left) > Number(right);
    case "lt":
      return Number(left) < Number(right);
    case "is_empty":
      return left.trim().length === 0;
    default:
      return false;
  }
}

export const conditionExecutor: NodeExecutor = async (node, ctx) => {
  const data = node.data as ConditionNodeData;

  if (data.mode === "llm_router" && data.routes?.length && data.llmPrompt) {
    const routeList = data.routes.map((r, i) => `${i + 1}. ${r.label} (id=${r.id})`).join("\n");
    const userPrompt = interpolateVariables(data.llmPrompt, ctx.variables);
    const sys = `You are a routing classifier. Given user input and a list of routes, return ONLY the route id that best matches.\nRoutes:\n${routeList}`;
    const text = await generateOllama({
      systemPrompt: sys,
      prompt: userPrompt,
      temperature: 0,
    });
    const cleaned = text.trim().split(/\s+/)[0];
    const matched = data.routes.find((r) => r.id === cleaned || r.label.toLowerCase() === cleaned.toLowerCase());
    const handle = matched?.id ?? data.routes[0]?.id;
    await ctx.emit({
      kind: "trace",
      trace: {
        id: `trc_${Date.now()}`,
        conversationId: ctx.input.conversationId,
        nodeId: node.id,
        nodeKind: "condition",
        level: "info",
        message: `LLM router selected route: ${handle}`,
        createdAt: Date.now(),
      },
    });
    const next = nextDefaultTarget(ctx.input.graph, node.id, handle);
    if (!next) {
      await ctx.emit({
        kind: "trace",
        trace: {
          id: `trc_${Date.now()}`,
          conversationId: ctx.input.conversationId,
          nodeId: node.id,
          nodeKind: "condition",
          level: "warn",
          message: `No outgoing edge for route handle "${handle}". Connect that route's port to the next block.`,
          createdAt: Date.now(),
        },
      });
    }
    return { nextNodeId: next };
  }

  for (const rule of data.rules ?? []) {
    if (evaluateRule(rule, ctx.variables)) {
      const next = nextDefaultTarget(ctx.input.graph, node.id, rule.id);
      if (!next) {
        await ctx.emit({
          kind: "trace",
          trace: {
            id: `trc_${Date.now()}`,
            conversationId: ctx.input.conversationId,
            nodeId: node.id,
            nodeKind: "condition",
            level: "warn",
            message: `Rule matched but there is no edge from handle "${rule.id}". In the canvas, drag from that rule's dot to the next node.`,
            createdAt: Date.now(),
          },
        });
      }
      return { nextNodeId: next };
    }
  }
  const elseNext = nextDefaultTarget(ctx.input.graph, node.id, "else");
  if (!elseNext) {
    await ctx.emit({
      kind: "trace",
      trace: {
        id: `trc_${Date.now()}`,
        conversationId: ctx.input.conversationId,
        nodeId: node.id,
        nodeKind: "condition",
        level: "warn",
        message: `No edge from the Else port (handle id "else"). Connect the Else row's handle to your fallback path.`,
        createdAt: Date.now(),
      },
    });
  }
  return { nextNodeId: elseNext };
};
