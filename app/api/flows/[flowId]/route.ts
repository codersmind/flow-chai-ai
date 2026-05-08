import { NextRequest, NextResponse } from "next/server";
import {
  getFlow,
  updateFlow,
  deleteFlow,
} from "@/lib/db/repositories/projects";
import { flowGraphSchema } from "@/validators/flow";

interface RouteParams {
  params: Promise<{ flowId: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { flowId } = await params;
  const flow = await getFlow(flowId);
  if (!flow) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ flow });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { flowId } = await params;
  const body = (await req.json()) as { name?: string; graph?: unknown };
  const patch: { name?: string; graphJson?: string } = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.graph !== undefined) {
    const parsed = flowGraphSchema.safeParse(body.graph);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }
    patch.graphJson = JSON.stringify(parsed.data);
  }
  const flow = await updateFlow(flowId, patch);
  if (!flow) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ flow });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { flowId } = await params;
  await deleteFlow(flowId);
  return NextResponse.json({ ok: true });
}
