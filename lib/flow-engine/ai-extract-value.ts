import "server-only";
import { generateOllama } from "@/lib/ai/stream";

export type TranscriptLine = {
  role: "user" | "assistant" | "system";
  content: string;
};

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

function isLikelyNameVariable(variable: string): boolean {
  const v = variable.trim().toLowerCase();
  if (!v) return false;
  if (v === "name" || v === "nickname") return true;
  if (/^(first|last|middle|full|display)_name$/.test(v)) return true;
  if (/^(firstname|lastname|fullname|fname|lname)$/.test(v)) return true;
  if (/_name$/.test(v) && !/(username|file_name|domain_name|namespace)/.test(v)) return true;
  return false;
}

function isLikelyAddressVariable(variable: string): boolean {
  const v = variable.trim().toLowerCase();
  if (!v) return false;
  return /address|location|city|town|where|home|live|postal|zip|area|neighbourhood|neighborhood/.test(v);
}

function fallbackAfterAiFailure(raw: string, variable: string): string {
  if (isLikelyNameVariable(variable)) return extractDisplayNameFromReply(raw);
  return raw.trim();
}

function naiveLocationFromTranscript(transcript: TranscriptLine[]): string | null {
  const userText = transcript
    .filter((l) => l.role === "user")
    .map((l) => l.content)
    .join("\n");
  const m =
    userText.match(/\b(?:living|live)\s+in\s+([A-Za-z][A-Za-z\s,.-]*?)(?=[.!?\n]|$)/i) ??
    userText.match(/\b(?:i\s*'?m\s+in|from)\s+([A-Za-z][A-Za-z\s,.-]*?)(?=[.!?\n]|$)/i);
  if (m?.[1]) {
    const s = m[1].trim().replace(/[,;]+$/, "");
    if (s.length >= 2 && s.length < 120) return s;
  }
  return null;
}

function smartFallback(
  raw: string,
  variable: string,
  transcript?: TranscriptLine[]
): string {
  if (isLikelyAddressVariable(variable) && transcript?.length) {
    const fromHist = naiveLocationFromTranscript(transcript);
    if (fromHist) return fromHist.slice(0, 500);
  }
  return fallbackAfterAiFailure(raw, variable);
}

function serializeVariablesForAi(vars: Record<string, unknown>, maxLen = 1400): string {
  const parts: string[] = [];
  let len = 0;
  for (const [k, v] of Object.entries(vars)) {
    if (k.startsWith("_")) continue;
    let line: string;
    if (typeof v === "string") line = `${k}=${v.slice(0, 400)}`;
    else if (typeof v === "number" || typeof v === "boolean") line = `${k}=${String(v)}`;
    else continue;
    if (len + line.length > maxLen) break;
    parts.push(line);
    len += line.length + 1;
  }
  return parts.length ? parts.join("\n") : "(no string variables)";
}

function formatTranscriptForPrompt(lines: TranscriptLine[], maxLines = 24): string {
  const slice = lines.slice(-maxLines);
  return slice
    .map((m) => `${m.role.toUpperCase()}: ${m.content.replace(/\s+/g, " ").trim()}`)
    .join("\n");
}

/**
 * Uses target variable name + question + optional transcript/variables so the model can
 * resolve deflections ("previous i told you") and multi-turn facts.
 */
export async function extractValueWithAi(
  userText: string,
  opts: {
    variable: string;
    question: string;
    transcript?: TranscriptLine[];
    variables?: Record<string, unknown>;
  }
): Promise<string> {
  const safe = userText.replace(/\r/g, " ").trim().slice(0, 1200);
  const varName = (opts.variable || "value").trim() || "value";
  const question = (opts.question || "").trim().slice(0, 500);
  const varJson = JSON.stringify(varName);
  const qJson = JSON.stringify(question);
  const varsBlock = opts.variables ? serializeVariablesForAi(opts.variables) : "";
  const transcriptBlock =
    opts.transcript && opts.transcript.length > 0
      ? formatTranscriptForPrompt(opts.transcript)
      : "";

  const addressHint = isLikelyAddressVariable(varName)
    ? "\n- This variable is likely an ADDRESS or PLACE. If the latest user line does not repeat the place but earlier USER lines mention where they live (e.g. \"living in Kolkata\"), output that place (normalize capitalization for city/area names). Never output vague phrases like \"previous i told you\" as the final value."
    : "";

  const system = `You extract the value a user meant to provide in reply to a chatbot.

You are given:
- Template variable name: ${varJson} (hints what kind of value is stored, e.g. address, name, phone, customer_name).
- Context (assistant question or flow step description): ${qJson}
${transcriptBlock ? "- A recent conversation transcript (oldest to newest within the window) appears below the rules." : ""}
${varsBlock ? "- Known flow variables (string facts already stored) appear below the rules." : ""}

Rules:
- Output exactly ONE line: the extracted value only. No quotes, bullets, or prefixes like "Answer:".
- If the latest user reply is a deflection or reference ("previous i told you", "same as before", "already said", "you know", "I told you earlier") and the question asks for facts they likely gave before, infer the concrete answer from the transcript and/or known variables. Do not return the deflection phrase itself as the value unless it is literally what they want stored.
- Strip leading filler ("hi", "sure", "well", "I live in", "my house is", "it's") when it is not part of the actual answer, but keep every substantive part of addresses and locations (area + city + region if given). Never drop a city or segment after a comma if the user included it.
- Person names: typically a few words; use natural capitalization.
- Addresses / "where I live": preserve commas between parts (e.g. "Shambazar, Kolkata"). Include all localities the user gave.
- Preserve the user's wording for places and spelling unless you are only fixing obvious capitalization of proper nouns.
- Yes/no or short factual replies: minimal exact value.
- If there is truly no usable value anywhere: UNKNOWN${addressHint}`;

  const parts: string[] = [`User reply or source text:\n"""${safe.replace(/"""/g, "'''")}"""`];
  if (transcriptBlock) {
    parts.push(`Recent transcript:\n${transcriptBlock}`);
  }
  if (varsBlock) {
    parts.push(`Known variables:\n${varsBlock}`);
  }
  const prompt = parts.join("\n\n");

  try {
    const out = await generateOllama({
      systemPrompt: system,
      prompt,
      temperature: 0,
      maxTokens: 280,
      timeoutMs: 25000,
    });
    let line = out.trim().split("\n")[0]?.trim() ?? "";
    line = line.replace(/^["'[\]()]+|["'[\]()]+$/g, "").trim();
    if (!line || /^unknown$/i.test(line)) {
      return smartFallback(userText, varName, opts.transcript);
    }
    /** Reject echoing obvious deflections as stored value when we have richer context */
    const deflect =
      /^(previous|same|already|told you|you know|as before|like i said)/i.test(line) &&
      ((opts.transcript?.length ?? 0) > 0 || varsBlock.length > 20);
    if (deflect) {
      const repaired = smartFallback(userText, varName, opts.transcript);
      if (!/^(previous|same|already|told you)/i.test(repaired)) return repaired;
      return naiveLocationFromTranscript(opts.transcript ?? []) ?? repaired;
    }
    return line.slice(0, 500);
  } catch {
    return smartFallback(userText, varName, opts.transcript);
  }
}
