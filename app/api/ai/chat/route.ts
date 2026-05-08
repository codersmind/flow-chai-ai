import { NextRequest } from "next/server";
import { streamText } from "ai";
import { getDefaultModel, getOllamaProvider } from "@/lib/ai/ollama";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    messages: { role: "system" | "user" | "assistant"; content: string }[];
    model?: string;
    temperature?: number;
  };
  const provider = await getOllamaProvider();
  const modelName = body.model || (await getDefaultModel());
  const result = streamText({
    model: provider(modelName),
    messages: body.messages,
    temperature: body.temperature ?? 0.7,
  });
  return result.toTextStreamResponse();
}
