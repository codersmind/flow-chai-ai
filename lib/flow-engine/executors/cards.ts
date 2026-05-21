import "server-only";
import { nanoid } from "nanoid";
import type { NodeExecutor } from "../registry";
import { nextDefaultTarget, type RuntimeContext } from "../runtime-context";
import { interpolateVariables } from "@/lib/utils";
import { buildCardSlidesFromVariable } from "../dynamic-card-list";
import type { CardSlide, CardsNodeData } from "@/types/flow";

function staticCardItems(data: CardsNodeData, ctx: RuntimeContext): CardSlide[] {
  return (data.cards ?? []).map((c) => ({
    id: c.id || `c_${nanoid(4)}`,
    title: interpolateVariables(c.title ?? "", ctx.variables),
    body: c.body ? interpolateVariables(c.body, ctx.variables) : undefined,
    imageUrl: c.imageUrl ? interpolateVariables(c.imageUrl, ctx.variables) : undefined,
  }));
}

export const cardsExecutor: NodeExecutor = async (node, ctx) => {
  const data = node.data as CardsNodeData;
  const intro = interpolateVariables(data.intro ?? "", ctx.variables).trim();

  const dynSource = (data.dynamicListSource ?? "").trim();
  let items: CardSlide[];

  if (dynSource) {
    const root = ctx.variables[dynSource];
    if (root === undefined) {
      await ctx.emit({
        kind: "trace",
        trace: {
          id: `trc_${Date.now()}`,
          conversationId: ctx.input.conversationId,
          nodeId: node.id,
          nodeKind: "cards",
          level: "warn",
          message: `Dynamic cards: variable "${dynSource}" is not set (run API / Set variable first).`,
          createdAt: Date.now(),
        },
      });
      items = [];
    } else {
      const { items: built, warning } = buildCardSlidesFromVariable(
        root,
        data.dynamicArrayPath,
        data.dynamicMapTitle,
        data.dynamicMapBody,
        data.dynamicMapImage,
        ctx
      );
      items = built;
      if (warning && items.length > 0) {
        await ctx.emit({
          kind: "trace",
          trace: {
            id: `trc_${Date.now()}`,
            conversationId: ctx.input.conversationId,
            nodeId: node.id,
            nodeKind: "cards",
            level: "info",
            message: `Dynamic cards: ${warning}`,
            createdAt: Date.now(),
          },
        });
      }
      if (warning && items.length === 0) {
        await ctx.emit({
          kind: "trace",
          trace: {
            id: `trc_${Date.now()}`,
            conversationId: ctx.input.conversationId,
            nodeId: node.id,
            nodeKind: "cards",
            level: "warn",
            message: `Dynamic cards: ${warning}`,
            createdAt: Date.now(),
          },
        });
      }
    }
    if (items.length === 0 && (data.cards ?? []).length > 0) {
      items = staticCardItems(data, ctx);
    }
  } else {
    items = staticCardItems(data, ctx);
  }

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
