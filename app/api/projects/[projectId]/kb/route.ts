import { NextRequest, NextResponse } from "next/server";
import {
  listKbSources,
  createKbSource,
  deleteKbSource,
  insertKbChunks,
} from "@/lib/db/repositories/kb";
import { embedTexts } from "@/lib/ai/embeddings";
import { chunkText } from "@/lib/rag/retrieval";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { projectId } = await params;
  const sources = await listKbSources(projectId);
  return NextResponse.json({ sources });
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { projectId } = await params;
  const body = (await req.json()) as { name?: string; content?: string };
  const name = body.name?.trim() || "Untitled source";
  const content = body.content?.trim();
  if (!content) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }
  const chunks = chunkText(content, 800, 100);
  const source = await createKbSource({
    projectId,
    name,
    sourceType: "text",
    contentLength: content.length,
  });
  try {
    const embeddings = await embedTexts(chunks);
    await insertKbChunks(
      chunks.map((c, i) => ({
        sourceId: source.id,
        projectId,
        content: c,
        embedding: embeddings[i] ?? [],
        chunkIndex: i,
      }))
    );
  } catch (err) {
    await deleteKbSource(source.id);
    const message = err instanceof Error ? err.message : "Embedding failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
  return NextResponse.json({ source }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { projectId: _ } = await params;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteKbSource(id);
  return NextResponse.json({ ok: true });
}
