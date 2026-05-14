import "server-only";
import { nanoid } from "nanoid";
import type { NodeExecutor } from "../registry";
import { nextDefaultTarget } from "../runtime-context";
import { interpolateVariables } from "@/lib/utils";
import type { CaptureNameCleanup, CaptureNodeData } from "@/types/flow";
import { generateOllama } from "@/lib/ai/stream";

/** Pull a short name from common self-intro phrases (case-insensitive). */
export function extractDisplayNameFromReply(raw: string): string {
  const t = raw.trim();
  const patterns = [
    /^i\s*am\s+(.+)$/i,
    /^i['']m\s+(.+)$/i,
    /^my\s+name\s+is\s+(.+)$/i,
    /^call\s+me\s+(.+)$/i,
    /^this\s+is\s+(.+)$/i,
    /^name\s*:\s*(.+)$/i,
    /^it['']s\s+(.+)$/i,
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return t;
}

function resolveCleanupMode(data: CaptureNodeData): CaptureNameCleanup {
  const raw = data.nameCleanup as CaptureNameCleanup | "patterns" | undefined;
  if (raw === "patterns") return "ai";
  if (raw === "ai" || raw === "none") return raw;
  if (data.extractDisplayName === true) return "ai";
  return "none";
}

function isLikelyNameVariable(variable: string): boolean {
  const v = variable.trim().toLowerCase();
  if (!v) return false;
  if (v === "name" || v === "nickname") return true;
  if (/^(first|last|middle|full|display)_name$/.test(v)) return true;
  if (/^(firstname|lastname|fullname|fname|lname)$/.test(v)) return true;
  return false;
}

function fallbackAfterAiFailure(raw: string, variable: string): string {
  if (isLikelyNameVariable(variable)) return extractDisplayNameFromReply(raw);
  return raw.trim();
}

/**
 * Uses the assistant question + variable name so the model keeps full addresses, multi-word names, etc.
 */
async function extractValueWithAi(
  userText: string,
  opts: { variable: string; question: string }
): Promise<string> {
  const safe = userText.replace(/\r/g, " ").trim().slice(0, 1200);
  const varName = (opts.variable || "value").trim() || "value";
  const question = (opts.question || "").trim().slice(0, 500);
  const varJson = JSON.stringify(varName);
  const qJson = JSON.stringify(question);

  const system = `You extract the value a user meant to provide in reply to a chatbot.

You are given:
- Template variable name: ${varJson} (hints what kind of value is stored, e.g. address, name, phone).
- Assistant question shown to the user: ${qJson}

Rules:
- Output exactly ONE line: the extracted value only. No quotes, bullets, or prefixes like "Answer:".
- Strip leading filler ("hi", "sure", "well", "I live in", "my house is", "it's") when it is not part of the actual answer, but keep every substantive part of addresses and locations (area + city + region if given). Never drop a city or segment after a comma if the user included it.
- Person names: typically a few words; use natural capitalization.
- Addresses / "where I live": preserve commas between parts (e.g. "Shambazar, Kolkata"). Include all localities the user gave.
- Preserve the user's wording for places and spelling unless you are only fixing obvious capitalization of proper nouns.
- Yes/no or short factual replies: minimal exact value.
- If there is no usable value: UNKNOWN`;

  const prompt = `User reply:\n"""${safe.replace(/"""/g, "'''")}"""`;

  try {
    const out = await generateOllama({
      systemPrompt: system,
      prompt,
      temperature: 0,
      maxTokens: 220,
      timeoutMs: 25000,
    });
    let line = out.trim().split("\n")[0]?.trim() ?? "";
    line = line.replace(/^["'[\]()]+|["'[\]()]+$/g, "").trim();
    if (!line || /^unknown$/i.test(line)) {
      return fallbackAfterAiFailure(userText, varName);
    }
    return line.slice(0, 500);
  } catch {
    return fallbackAfterAiFailure(userText, varName);
  }
}

async function reduceCapturedValue(
  raw: string,
  data: CaptureNodeData,
  questionShown: string
): Promise<string> {
  const mode = resolveCleanupMode(data);
  if (mode === "none") return raw;
  return extractValueWithAi(raw, {
    variable: data.variable ?? "",
    question: questionShown,
  });
}

export const captureExecutor: NodeExecutor = async (node, ctx) => {
  const data = node.data as CaptureNodeData;
  if (ctx.input.resumeFromNodeId === node.id && ctx.input.userMessage !== undefined) {
    const raw = ctx.input.userMessage;
    const questionShown = interpolateVariables(data.prompt ?? "", ctx.variables);
    const value = await reduceCapturedValue(raw, data, questionShown);
    if (data.variable) {
      ctx.variables[data.variable] = value;
      await ctx.emit({ kind: "variable_set", variable: data.variable, value });
    }
    return {
      nextNodeId: nextDefaultTarget(ctx.input.graph, node.id),
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
  const suggestionChips = (data.suggestedReplies ?? [])
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  await ctx.emit({
    kind: "request_input",
    nodeId: node.id,
    prompt,
    suggestedReplies: suggestionChips,
  });
  ctx.awaitingInput = true;
  ctx.pendingInputNodeId = node.id;
  return { nextNodeId: null, awaitInput: true };
};
