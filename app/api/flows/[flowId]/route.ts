import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
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
  const existing = await getFlow(flowId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as {
    name?: string;
    graph?: unknown;
    embed?: { enabled?: boolean; regenerate?: boolean };
  };
  const patch: {
    name?: string;
    graphJson?: string;
    embedEnabled?: boolean;
    embedToken?: string | null;
  } = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.graph !== undefined) {
    const parsed = flowGraphSchema.safeParse(body.graph);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }
    patch.graphJson = JSON.stringify(parsed.data);
  }
  if (body.embed !== undefined) {
    const e = body.embed;
    if (e.regenerate === true) {
      patch.embedEnabled = true;
      patch.embedToken = `emb_${nanoid(24)}`;
    } else if (e.enabled === false) {
      patch.embedEnabled = false;
      patch.embedToken = null;
    } else if (e.enabled === true) {
      patch.embedEnabled = true;
      if (!existing.embedToken) {
        patch.embedToken = `emb_${nanoid(24)}`;
      }
    }
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
