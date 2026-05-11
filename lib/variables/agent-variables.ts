import type { AgentVariable } from "@/types/project";
import { agentVariableDefSchema } from "@/validators/agent-variables";

function coerceDefault(def: AgentVariable): unknown {
  const raw = def.defaultValue;
  if (raw === undefined || raw === "") {
    if (def.type === "boolean") return false;
    if (def.type === "number") return 0;
    return "";
  }
  switch (def.type) {
    case "number": {
      const n = Number(raw);
      return Number.isFinite(n) ? n : 0;
    }
    case "boolean":
      return raw === "true" || raw === "1" || raw.toLowerCase() === "yes";
    default:
      return raw;
  }
}

export function parseAgentVariablesJson(json: string | null | undefined): AgentVariable[] {
  if (!json || json.trim() === "") return [];
  try {
    const data = JSON.parse(json) as unknown;
    if (!Array.isArray(data)) return [];
    const out: AgentVariable[] = [];
    const seen = new Set<string>();
    for (const item of data) {
      const parsed = agentVariableDefSchema.safeParse(item);
      if (!parsed.success) continue;
      if (seen.has(parsed.data.name)) continue;
      seen.add(parsed.data.name);
      out.push(parsed.data);
    }
    return out;
  } catch {
    return [];
  }
}

/** Fills missing keys from agent definitions (Voiceflow-style defaults). */
export function mergeAgentVariableDefaults(
  runtime: Record<string, unknown>,
  definitions: AgentVariable[]
): Record<string, unknown> {
  const out = { ...runtime };
  for (const def of definitions) {
    if (!(def.name in out)) {
      out[def.name] = coerceDefault(def);
    }
  }
  return out;
}
