import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function interpolateVariables(
  template: string,
  variables: Record<string, unknown>
): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key: string) => {
    const path = key.split(".");
    let value: unknown = variables;
    for (const segment of path) {
      if (value && typeof value === "object" && segment in (value as object)) {
        value = (value as Record<string, unknown>)[segment];
      } else {
        return "";
      }
    }
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
