import { nanoid } from "nanoid";
import { interpolateVariables } from "@/lib/utils";
import type { CardSlide } from "@/types/flow";

export function getByPath(root: unknown, path: string): unknown {
  const keys = path
    .split(".")
    .map((s) => s.trim())
    .filter(Boolean);
  if (keys.length === 0) return root;
  let cur: unknown = root;
  for (const k of keys) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return cur;
}

export function stringifyCell(
  val: unknown,
  variables: Record<string, unknown>
): string {
  if (val == null) return "";
  if (typeof val === "string") return interpolateVariables(val, variables);
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  try {
    return JSON.stringify(val);
  } catch {
    return String(val);
  }
}

export function normalizedCardMapKeys(
  mapTitle?: string,
  mapBody?: string,
  mapImage?: string
) {
  return {
    titleKey:
      (mapTitle ?? "").trim().split(/\r?\n/)[0]?.trim() || "title",
    bodyKeyConfigured:
      (mapBody ?? "").trim().split(/\r?\n/)[0]?.trim() ?? "",
    imageKeyConfigured:
      (mapImage ?? "").trim().split(/\r?\n/)[0]?.trim() ?? "",
  };
}

export type CardMapKeys = ReturnType<typeof normalizedCardMapKeys>;

export function mapRowToCardSlide(
  row: unknown,
  index: number,
  keys: CardMapKeys,
  variables: Record<string, unknown>,
  slideId: string
): CardSlide {
  const { titleKey, bodyKeyConfigured, imageKeyConfigured } = keys;

  if (row == null || typeof row !== "object") {
    const s = row == null ? "" : String(row);
    return {
      id: slideId,
      title: interpolateVariables(s, variables) || `Item ${index + 1}`,
      body: undefined,
      imageUrl: undefined,
    };
  }
  const o = row as Record<string, unknown>;

  const titleRaw = o[titleKey];
  let title = stringifyCell(titleRaw, variables).trim();
  if (!title) title = `Item ${index + 1}`;

  let body = "";
  if (bodyKeyConfigured) {
    body = stringifyCell(o[bodyKeyConfigured], variables).trim();
    } else {
      const b =
        o["description"] ??
        o["body"] ??
        o["subtitle"] ??
        o["summary"] ??
        o["text"] ??
        o["message"] ??
        o["content"] ??
        o["name"] ??
        o["label"] ??
        o["value"];
      body = stringifyCell(b, variables).trim();
    }

  let imageUrl = "";
  if (imageKeyConfigured) {
    const v = o[imageKeyConfigured];
    if (typeof v === "string" && v.trim())
      imageUrl = interpolateVariables(v.trim(), variables);
  } else {
    for (const k of ["imageUrl", "image", "thumbnail", "photo", "img", "picture"]) {
      const v = o[k];
      if (typeof v === "string" && v.trim()) {
        imageUrl = interpolateVariables(v.trim(), variables);
        break;
      }
    }
  }

  return {
    id: slideId,
    title,
    body: body || undefined,
    imageUrl: imageUrl || undefined,
  };
}

/**
 * Same resolution rules as runtime `buildCardSlidesFromVariable`, for reuse in the
 * server executor and client-side inspector preview.
 */
/**
 * Resolve the array (or single row) to map into slides — same rules for runtime and inspector preview.
 *
 * - If **Path to array** does not match but the variable root is already an array, we use that array
 *   (common mistake: putting a row field name like `title` in the path).
 * - A single object becomes a one-item list.
 * - A JSON string / number / boolean becomes a one-item list (one slide, title from the value).
 */
export function resolveCardListSource(
  root: unknown,
  arrayPath: string | undefined
): { rows: unknown[]; warning?: string } {
  const pathTrim = (arrayPath ?? "").trim();
  const at = getByPath(root, pathTrim);
  let pathWarning: string | undefined;

  let rawList: unknown;
  if (pathTrim && at === undefined && Array.isArray(root) && root.length > 0) {
    rawList = root;
    pathWarning =
      `Path "${pathTrim}" did not match your data; the variable is already an array, so the full array was used. ` +
      `Clear "Path to array" unless you need a segment like data.items (not a row field like title).`;
  } else {
    rawList = at === undefined ? root : at;
  }

  if (rawList == null) {
    return {
      rows: [],
      warning: pathWarning ?? "List variable resolved to null/undefined",
    };
  }

  if (Array.isArray(rawList)) {
    return { rows: rawList, warning: pathWarning };
  }

  if (
    typeof rawList === "string" ||
    typeof rawList === "number" ||
    typeof rawList === "boolean"
  ) {
    return { rows: [rawList], warning: pathWarning };
  }

  if (typeof rawList === "object") {
    return { rows: [rawList], warning: pathWarning };
  }

  return {
    rows: [],
    warning: pathWarning ?? "No rows: value is not an array, object, or scalar",
  };
}

export function buildSlidesFromRoot(
  root: unknown,
  arrayPath: string | undefined,
  mapTitle: string | undefined,
  mapBody: string | undefined,
  mapImage: string | undefined,
  variables: Record<string, unknown>
): { items: CardSlide[]; warning?: string } {
  const keys = normalizedCardMapKeys(mapTitle, mapBody, mapImage);
  const { rows, warning } = resolveCardListSource(root, arrayPath);

  if (rows.length === 0) {
    return { items: [], warning };
  }

  const items: CardSlide[] = rows.map((row, i) =>
    mapRowToCardSlide(row, i, keys, variables, `dyn_${i}_${nanoid(4)}`)
  );

  return { items, warning };
}

/** First row after resolving `arrayPath` from `root` (same rules as slide building). */
export function firstListRow(
  root: unknown,
  arrayPath: string | undefined
): unknown | null {
  return resolveCardListSource(root, arrayPath).rows[0] ?? null;
}
