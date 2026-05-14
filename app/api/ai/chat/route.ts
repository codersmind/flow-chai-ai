import { NextRequest } from "next/server";
import { streamText } from "ai";
import { getChatLanguageModel, getDefaultChatModelId } from "@/lib/ai/stream";
import { getSettings } from "@/lib/db/repositories/settings";
import { listOllamaModels } from "@/lib/ai/ollama";

export const runtime = "nodejs";

async function resolveModelId(requested?: string): Promise<string> {
  const settings = await getSettings();
  const fallback = await getDefaultChatModelId();
  const preferred = requested?.trim() || fallback.trim();
  if (settings.aiProvider === "openai") {
    return preferred;
  }
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
  const modelId = await resolveModelId(body.model);
  const model = await getChatLanguageModel({ model: modelId });
  const result = streamText({
    model,
    messages: body.messages,
    temperature: body.temperature ?? 0.7,
  });
  return result.toTextStreamResponse();
}
