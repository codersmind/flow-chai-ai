import "server-only";
import { generateText, streamText } from "ai";
import { getDefaultModel, getOllamaProvider, listOllamaModels } from "./ollama";

export interface ChatOptions {
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  jsonMode?: boolean;
  maxTokens?: number;
  timeoutMs?: number;
  prompt: string;
}

async function resolveModelName(requested?: string): Promise<string> {
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

export async function generateOllama(opts: ChatOptions): Promise<string> {
  const provider = await getOllamaProvider();
  const modelName = await resolveModelName(opts.model);
  const model = provider(modelName, opts.jsonMode ? { structuredOutputs: true } : undefined);
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
  const provider = await getOllamaProvider();
  const modelName = await resolveModelName(opts.model);
  const model = provider(modelName, opts.jsonMode ? { structuredOutputs: true } : undefined);
  return streamText({
    model,
    system: opts.systemPrompt,
    prompt: opts.prompt,
    temperature: opts.temperature ?? 0.7,
    maxTokens: opts.maxTokens ?? 220,
    abortSignal: AbortSignal.timeout(opts.timeoutMs ?? 45000),
  });
}
