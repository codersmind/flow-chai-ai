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
  return {
    ollamaBaseUrl: row.ollamaBaseUrl,
    ollamaDefaultModel: row.ollamaDefaultModel,
    ollamaEmbeddingModel: row.ollamaEmbeddingModel,
    ttsVoice: row.ttsVoice,
    sttLanguage: row.sttLanguage,
  };
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  await dbReady;
  await db
    .update(appSettings)
    .set({ ...patch, updatedAt: Date.now() })
    .where(eq(appSettings.id, SINGLETON_ID));
  return getSettings();
}
