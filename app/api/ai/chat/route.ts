import { NextRequest } from "next/server";
import { streamText } from "ai";
import { getDefaultModel, getOllamaProvider, listOllamaModels } from "@/lib/ai/ollama";

export const runtime = "nodejs";

async function resolveModelName(requested?: string): Promise<string> {
  const fallback = await getDefaultModel();
  const preferred = requested?.trim() || fallback.trim();
  const models = await listOllamaModels();
  if (models.length === 0) return preferred;
  if (models.includes(preferred)) return preferred;
  if (!preferred.includes(":")) {
    const latest = `${preferred}:latest`;
    if (models.includes(latest)) return latest;
  } else if (preferred.endsWith(":latest")) {
    const base = preferred.replace(/:latest$/, "");
    if (models.includes(base)) return base;
  }
  const base = preferred.split(":")[0];
  const byBase = models.find((m) => m === base || m.startsWith(`${base}:`));
  return byBase ?? preferred;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    messages: { role: "system" | "user" | "assistant"; content: string }[];
    model?: string;
    temperature?: number;
  };
  const provider = await getOllamaProvider();
  const modelName = await resolveModelName(body.model);
  const result = streamText({
    model: provider(modelName),
    messages: body.messages,
    temperature: body.temperature ?? 0.7,
  });
  return result.toTextStreamResponse();
}
