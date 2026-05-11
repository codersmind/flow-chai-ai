import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

/** One segment of a path like `rows[0].name` → `rows`, `0`, `name`. */
export type VariablePathSegment = string | number;

/**
 * Parses a variable path inside `{{ ... }}` (JavaScript-style):
 * `api_result[0].name`, `user["display_name"]`, `list.0.title`, `foo.bar.baz`
 */
export function parseVariablePath(input: string): VariablePathSegment[] | null {
  const s = input.trim();
  if (!s) return null;
  const segments: VariablePathSegment[] = [];
  let i = 0;

  const skipSpaces = () => {
    while (i < s.length && /\s/.test(s[i])) i++;
  };

  /** First path segment must be a variable name (letter or _). */
  const readRootName = (): string | null => {
    skipSpaces();
    if (i >= s.length || !/[a-zA-Z_$]/.test(s[i])) return null;
    const start = i;
    i++;
    while (i < s.length && /[\w$]/.test(s[i])) i++;
    return s.slice(start, i);
  };

  /** After `.`, allow `name` or numeric index key `0` (same as `["0"]` on objects). */
  const readDottedSegment = (): string | null => {
    skipSpaces();
    if (i >= s.length) return null;
    const start = i;
    if (/[a-zA-Z_$]/.test(s[i])) {
      i++;
      while (i < s.length && /[\w$]/.test(s[i])) i++;
      return s.slice(start, i);
    }
    if (/\d/.test(s[i])) {
      while (i < s.length && /\d/.test(s[i])) i++;
      return s.slice(start, i);
    }
    return null;
  };

  const first = readRootName();
  if (!first) return null;
  segments.push(first);

  while (true) {
    skipSpaces();
    if (i >= s.length) break;
    if (s[i] === ".") {
      i++;
      const w = readDottedSegment();
      if (!w) return null;
      segments.push(w);
      continue;
    }
    if (s[i] === "[") {
      const close = s.indexOf("]", i);
      if (close === -1) return null;
      const inner = s.slice(i + 1, close).trim();
      i = close + 1;
      if (/^\d+$/.test(inner)) {
        segments.push(Number(inner));
      } else if (
        (inner.startsWith('"') && inner.endsWith('"') && inner.length >= 2) ||
        (inner.startsWith("'") && inner.endsWith("'") && inner.length >= 2)
      ) {
        segments.push(inner.slice(1, -1));
      } else {
        return null;
      }
      continue;
    }
    return null;
  }
  return segments;
}

export function getVariableAtPath(
  variables: Record<string, unknown>,
  path: VariablePathSegment[]
): unknown {
  if (!path.length) return undefined;
  let cur: unknown = variables;
  for (const seg of path) {
    const key = typeof seg === "number" ? String(seg) : seg;
    if (cur == null || typeof cur !== "object") return undefined;
    const obj = cur as Record<string, unknown>;
    if (!(key in obj)) return undefined;
    cur = obj[key];
  }
  return cur;
}

export function interpolateVariables(
  template: string,
  variables: Record<string, unknown>
): string {
  return template.replace(/\{\{\s*([\s\S]*?)\s*\}\}/g, (full, inner: string) => {
    const path = parseVariablePath(inner);
    if (!path) return full;
    const value = getVariableAtPath(variables, path);
    if (value === undefined || value === null) return "";
    return typeof value === "string" ? value : JSON.stringify(value);
  });
}

export function safeJsonParse<T = unknown>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
