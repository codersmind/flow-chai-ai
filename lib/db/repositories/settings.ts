import "server-only";
import { eq } from "drizzle-orm";
import { db, dbReady } from "../client";
import { appSettings } from "../schema";
import type { AppSettings } from "@/types/project";

const SINGLETON_ID = "singleton";

export async function getSettings(): Promise<AppSettings> {
  await dbReady;
  const rows = await db.select().from(appSettings).where(eq(appSettings.id, SINGLETON_ID)).limit(1);
  let row = rows[0];
  if (!row) {
    await db.insert(appSettings).values({ id: SINGLETON_ID });
    const refetched = await db.select().from(appSettings).where(eq(appSettings.id, SINGLETON_ID)).limit(1);
    row = refetched[0]!;
  }
  const provider = row.aiProvider === "openai" ? "openai" : "ollama";
  return {
    aiProvider: provider,
    ollamaBaseUrl: row.ollamaBaseUrl,
    ollamaDefaultModel: row.ollamaDefaultModel,
    ollamaEmbeddingModel: row.ollamaEmbeddingModel,
    openaiApiKey: row.openaiApiKey ?? null,
    openaiDefaultModel: row.openaiDefaultModel ?? "gpt-4o-mini",
    openaiBaseUrl: row.openaiBaseUrl ?? null,
    ttsVoice: row.ttsVoice,
    sttLanguage: row.sttLanguage,
  };
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  await dbReady;
  const row: Record<string, unknown> = { updatedAt: Date.now() };
  if (patch.aiProvider !== undefined) row.aiProvider = patch.aiProvider;
  if (patch.ollamaBaseUrl !== undefined) row.ollamaBaseUrl = patch.ollamaBaseUrl;
  if (patch.ollamaDefaultModel !== undefined) row.ollamaDefaultModel = patch.ollamaDefaultModel;
  if (patch.ollamaEmbeddingModel !== undefined) row.ollamaEmbeddingModel = patch.ollamaEmbeddingModel;
  if (patch.openaiApiKey !== undefined) row.openaiApiKey = patch.openaiApiKey;
  if (patch.openaiDefaultModel !== undefined) row.openaiDefaultModel = patch.openaiDefaultModel;
  if (patch.openaiBaseUrl !== undefined) row.openaiBaseUrl = patch.openaiBaseUrl;
  if (patch.ttsVoice !== undefined) row.ttsVoice = patch.ttsVoice;
  if (patch.sttLanguage !== undefined) row.sttLanguage = patch.sttLanguage;
  await db.update(appSettings).set(row).where(eq(appSettings.id, SINGLETON_ID));
  return getSettings();
}
