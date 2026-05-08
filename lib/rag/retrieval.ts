import "server-only";
import { getProjectChunks } from "../db/repositories/kb";
import { cosineSimilarity, embedText } from "../ai/embeddings";

export interface RetrievalHit {
  id: string;
  sourceId: string;
  content: string;
  score: number;
}

export async function retrieveTopK(
  projectId: string,
  query: string,
  topK = 4
): Promise<RetrievalHit[]> {
  const [chunks, queryEmbedding] = await Promise.all([
    getProjectChunks(projectId),
    embedText(query),
  ]);
  if (!chunks.length) return [];
  const scored = chunks.map((c) => ({
    id: c.id,
    sourceId: c.sourceId,
    content: c.content,
    score: cosineSimilarity(c.embedding, queryEmbedding),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

export function chunkText(text: string, chunkSize = 800, overlap = 100): string[] {
  const out: string[] = [];
  const trimmed = text.trim();
  if (!trimmed) return out;
  let start = 0;
  while (start < trimmed.length) {
    const end = Math.min(start + chunkSize, trimmed.length);
    out.push(trimmed.slice(start, end));
    if (end >= trimmed.length) break;
    start = end - overlap;
  }
  return out;
}
