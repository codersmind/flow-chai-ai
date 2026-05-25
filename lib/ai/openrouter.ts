import "server-only";

export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

/** Fallback when the models API is unreachable. */
export const OPENROUTER_CURATED_MODELS = [
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
  "anthropic/claude-3.5-sonnet",
  "google/gemini-2.0-flash-001",
  "meta-llama/llama-3.3-70b-instruct",
];

export function resolveOpenRouterApiKey(storedKey: string | null | undefined): string {
  return (storedKey?.trim() || process.env.OPENROUTER_API_KEY || "").trim();
}

export function openRouterHeaders(): Record<string, string> {
  return {
    "HTTP-Referer":
      process.env.OPENROUTER_SITE_URL?.trim() || "http://localhost:3000",
    "X-Title": process.env.OPENROUTER_APP_TITLE?.trim() || "LocalVoiceFlow",
  };
}

export async function listOpenRouterModels(apiKey: string): Promise<string[]> {
  if (!apiKey) return [...OPENROUTER_CURATED_MODELS];
  try {
    const res = await fetch(`${OPENROUTER_BASE_URL}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...openRouterHeaders(),
      },
    });
    if (!res.ok) return [...OPENROUTER_CURATED_MODELS];
    const json = (await res.json()) as { data?: { id: string }[] };
    const ids = (json.data ?? []).map((m) => m.id).filter(Boolean);
    return ids.length > 0 ? ids.sort() : [...OPENROUTER_CURATED_MODELS];
  } catch {
    return [...OPENROUTER_CURATED_MODELS];
  }
}
