import "server-only";
import { generateText, streamText } from "ai";
import { getDefaultModel, getOllamaProvider } from "./ollama";

export interface ChatOptions {
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  jsonMode?: boolean;
  prompt: string;
}

export async function generateOllama(opts: ChatOptions): Promise<string> {
  const provider = await getOllamaProvider();
  const modelName = opts.model || (await getDefaultModel());
  const model = provider(modelName, opts.jsonMode ? { structuredOutputs: true } : undefined);
  const result = await generateText({
    model,
    system: opts.systemPrompt,
    prompt: opts.prompt,
    temperature: opts.temperature ?? 0.7,
  });
  return result.text;
}

export async function streamOllama(opts: ChatOptions) {
  const provider = await getOllamaProvider();
  const modelName = opts.model || (await getDefaultModel());
  const model = provider(modelName, opts.jsonMode ? { structuredOutputs: true } : undefined);
  return streamText({
    model,
    system: opts.systemPrompt,
    prompt: opts.prompt,
    temperature: opts.temperature ?? 0.7,
  });
}
