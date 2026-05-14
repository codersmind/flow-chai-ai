import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/db/repositories/settings";
import { listOllamaModels } from "@/lib/ai/ollama";
import { settingsPatchSchema } from "@/validators/settings";

export async function GET() {
  const [settings, models] = await Promise.all([getSettings(), listOllamaModels()]);
  return NextResponse.json({ settings, models });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const parsed = settingsPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const settings = await updateSettings(parsed.data);
  return NextResponse.json({ settings });
}
