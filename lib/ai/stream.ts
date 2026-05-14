import "server-only";
import type { LanguageModel } from "ai";
import { generateText, streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getDefaultModel, getOllamaProvider, listOllamaModels } from "./ollama";
import { getSettings } from "@/lib/db/repositories/settings";

export interface ChatOptions {
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  jsonMode?: boolean;
  maxTokens?: number;
  timeoutMs?: number;
  prompt: string;
}

export async function getDefaultChatModelId(): Promise<string> {
  const s = await getSettings();
  if (s.aiProvider === "openai") return s.openaiDefaultModel;
  return getDefaultModel();
}

async function resolveOllamaModelName(requested?: string): Promise<string> {
  const defaultModel = await getDefaultModel();
  const preferred = requested?.trim() || defaultModel.trim();
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

export async function getChatLanguageModel(opts: {
  model?: string;
  jsonMode?: boolean;
}): Promise<LanguageModel> {
  const settings = await getSettings();
  if (settings.aiProvider === "openai") {
    const apiKey = (settings.openaiApiKey?.trim() || process.env.OPENAI_API_KEY || "").trim();
    if (!apiKey) {
      throw new Error(
        "OpenAI is selected but no API key is configured. Add it in Settings or set OPENAI_API_KEY in the environment."
      );
    }
    const baseURL = settings.openaiBaseUrl?.trim();
    const openai = createOpenAI({
      apiKey,
      baseURL: baseURL && baseURL.length > 0 ? baseURL : undefined,
    });
    const id = (opts.model?.trim() || settings.openaiDefaultModel || "gpt-4o-mini").trim();
    return openai(id, opts.jsonMode ? { structuredOutputs: true } : undefined);
  }
  const provider = await getOllamaProvider();
  const modelName = await resolveOllamaModelName(opts.model);
  return provider(modelName, opts.jsonMode ? { structuredOutputs: true } : undefined);
}

export async function generateOllama(opts: ChatOptions): Promise<string> {
  const model = await getChatLanguageModel({ model: opts.model, jsonMode: opts.jsonMode });
  const result = await generateText({
    model,
    system: opts.systemPrompt,
    prompt: opts.prompt,
    temperature: opts.temperature ?? 0.7,
    maxTokens: opts.maxTokens ?? 220,
    abortSignal: AbortSignal.timeout(opts.timeoutMs ?? 45000),
  });
  return result.text;
}

export async function streamOllama(opts: ChatOptions) {
  const model = await getChatLanguageModel({ model: opts.model, jsonMode: opts.jsonMode });
  return streamText({
    model,
    system: opts.systemPrompt,
    prompt: opts.prompt,
    temperature: opts.temperature ?? 0.7,
    maxTokens: opts.maxTokens ?? 220,
    abortSignal: AbortSignal.timeout(opts.timeoutMs ?? 45000),
  });
}
