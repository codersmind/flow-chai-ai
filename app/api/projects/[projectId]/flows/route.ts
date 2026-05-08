import { NextRequest, NextResponse } from "next/server";
import {
  listFlowsForProject,
  createFlow,
} from "@/lib/db/repositories/projects";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { projectId } = await params;
  const flows = await listFlowsForProject(projectId);
  return NextResponse.json({ flows });
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { projectId } = await params;
  const body = (await req.json()) as { name?: string };
  const flow = await createFlow({ projectId, name: body.name?.trim() || "Untitled flow" });
  return NextResponse.json({ flow }, { status: 201 });
}
