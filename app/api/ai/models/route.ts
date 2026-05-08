import { NextResponse } from "next/server";
import { listOllamaModels } from "@/lib/ai/ollama";

export async function GET() {
  const models = await listOllamaModels();
  return NextResponse.json({ models });
}
