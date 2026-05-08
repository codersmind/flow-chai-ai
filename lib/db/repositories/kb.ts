import "server-only";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, dbReady } from "../client";
import { kbSources, kbChunks } from "../schema";

export interface KBSource {
  id: string;
  projectId: string;
  name: string;
  sourceType: string;
  contentLength: number;
  createdAt: number;
}

export interface KBChunk {
  id: string;
  sourceId: string;
  projectId: string;
  content: string;
  embedding: number[];
  chunkIndex: number;
}

export async function listKbSources(projectId: string): Promise<KBSource[]> {
  await dbReady;
  return db
    .select()
    .from(kbSources)
    .where(eq(kbSources.projectId, projectId)) as Promise<KBSource[]>;
}

export async function createKbSource(input: {
  projectId: string;
  name: string;
  sourceType: string;
  contentLength: number;
}): Promise<KBSource> {
  await dbReady;
  const id = `kbs_${nanoid(10)}`;
  await db.insert(kbSources).values({
    id,
    projectId: input.projectId,
    name: input.name,
    sourceType: input.sourceType,
    contentLength: input.contentLength,
  });
  const rows = await db.select().from(kbSources).where(eq(kbSources.id, id)).limit(1);
  return rows[0]! as KBSource;
}

export async function deleteKbSource(id: string): Promise<void> {
  await dbReady;
  await db.delete(kbSources).where(eq(kbSources.id, id));
}

export async function insertKbChunks(
  chunks: { sourceId: string; projectId: string; content: string; embedding: number[]; chunkIndex: number }[]
): Promise<void> {
  await dbReady;
  if (!chunks.length) return;
  const rows = chunks.map((c) => ({
    id: `kbc_${nanoid(10)}`,
    sourceId: c.sourceId,
    projectId: c.projectId,
    content: c.content,
    embedding: JSON.stringify(c.embedding),
    chunkIndex: c.chunkIndex,
  }));
  await db.insert(kbChunks).values(rows);
}

export async function getProjectChunks(projectId: string): Promise<KBChunk[]> {
  await dbReady;
  const rows = await db.select().from(kbChunks).where(eq(kbChunks.projectId, projectId));
  return rows.map((row) => ({
    id: row.id,
    sourceId: row.sourceId,
    projectId: row.projectId,
    content: row.content,
    embedding: JSON.parse(row.embedding) as number[],
    chunkIndex: row.chunkIndex,
  }));
}
