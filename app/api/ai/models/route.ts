import { NextResponse } from "next/server";
import { listOllamaModels } from "@/lib/ai/ollama";
import { getSettings } from "@/lib/db/repositories/settings";

const OPENAI_CURATED = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "gpt-4",
  "o1-mini",
  "o1-preview",
  "gpt-3.5-turbo",
];

export async function GET() {
  const settings = await getSettings();
  if (settings.aiProvider === "openai") {
    return NextResponse.json({ models: OPENAI_CURATED, provider: "openai" as const });
  }
  const models = await listOllamaModels();
  return NextResponse.json({ models, provider: "ollama" as const });
}
