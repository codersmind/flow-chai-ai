import "server-only";
import type { CardSlide } from "@/types/flow";
import type { RuntimeContext } from "./runtime-context";
import { buildSlidesFromRoot } from "./dynamic-card-mapping";

/**
 * Build card slides from an API / JSON array (or single object) using optional field keys.
 */
export function buildCardSlidesFromVariable(
  root: unknown,
  arrayPath: string | undefined,
  mapTitle: string | undefined,
  mapBody: string | undefined,
  mapImage: string | undefined,
  ctx: RuntimeContext
): { items: CardSlide[]; warning?: string } {
  return buildSlidesFromRoot(
    root,
    arrayPath,
    mapTitle,
    mapBody,
    mapImage,
    ctx.variables
  );
}
