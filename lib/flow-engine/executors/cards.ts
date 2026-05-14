import "server-only";
import { nanoid } from "nanoid";
import type { NodeExecutor } from "../registry";
import { nextDefaultTarget } from "../runtime-context";
import { interpolateVariables } from "@/lib/utils";
import type { CardSlide, CardsNodeData } from "@/types/flow";

export const cardsExecutor: NodeExecutor = async (node, ctx) => {
  const data = node.data as CardsNodeData;
  const intro = interpolateVariables(data.intro ?? "", ctx.variables).trim();
  const items: CardSlide[] = (data.cards ?? []).map((c) => ({
    id: c.id || `c_${nanoid(4)}`,
    title: interpolateVariables(c.title ?? "", ctx.variables),
    body: c.body ? interpolateVariables(c.body, ctx.variables) : undefined,
    imageUrl: c.imageUrl ? interpolateVariables(c.imageUrl, ctx.variables) : undefined,
  }));

  const speakText =
    intro ||
    items
      .map((c) => [c.title, c.body].filter(Boolean).join(". "))
      .join(". ") ||
    "";

  if (!speakText.trim() && items.length === 0) {
    return { nextNodeId: nextDefaultTarget(ctx.input.graph, node.id) };
  }

  await ctx.emit({
    kind: "message",
    message: {
      id: `msg_${nanoid(8)}`,
      role: "assistant",
      content: speakText.trim() || "\u00a0",
      createdAt: Date.now(),
      nodeId: node.id,
      cards:
        items.length > 0
          ? { layout: data.layout === "carousel" ? "carousel" : "stack", items }
          : undefined,
    },
  });

  return { nextNodeId: nextDefaultTarget(ctx.input.graph, node.id) };
};
