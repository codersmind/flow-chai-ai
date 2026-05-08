import "server-only";
import { getSettings } from "../db/repositories/settings";

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const settings = await getSettings();
  const url = `${settings.ollamaBaseUrl.replace(/\/$/, "")}/api/embeddings`;
  const out: number[][] = [];
  for (const text of texts) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: settings.ollamaEmbeddingModel, prompt: text }),
    });
    if (!res.ok) {
      throw new Error(`Embedding request failed: ${res.status} ${res.statusText}`);
    }
    const json = (await res.json()) as { embedding?: number[] };
    if (!json.embedding) throw new Error("Embedding response missing 'embedding'");
    out.push(json.embedding);
  }
  return out;
}

export async function embedText(text: string): Promise<number[]> {
  const [v] = await embedTexts([text]);
  return v;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
