import "server-only";
import { createOllama } from "ollama-ai-provider";
import { getSettings } from "../db/repositories/settings";

export async function getOllamaProvider() {
  const settings = await getSettings();
  return createOllama({
    baseURL: `${settings.ollamaBaseUrl.replace(/\/$/, "")}/api`,
  });
}

export async function getDefaultModel(): Promise<string> {
  const settings = await getSettings();
  return settings.ollamaDefaultModel;
}

export async function getEmbeddingModel(): Promise<string> {
  const settings = await getSettings();
  return settings.ollamaEmbeddingModel;
}

export async function listOllamaModels(): Promise<string[]> {
  try {
    const settings = await getSettings();
    const res = await fetch(`${settings.ollamaBaseUrl.replace(/\/$/, "")}/api/tags`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { models?: { name: string }[] };
    return data.models?.map((m) => m.name) ?? [];
  } catch {
    return [];
  }
}
