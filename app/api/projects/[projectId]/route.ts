import { NextRequest, NextResponse } from "next/server";
import {
  getProject,
  updateProject,
  deleteProject,
  listFlowsForProject,
} from "@/lib/db/repositories/projects";
import { projectFormSchema } from "@/validators/project";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const flows = await listFlowsForProject(projectId);
  return NextResponse.json({ project, flows });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { projectId } = await params;
  const body = await req.json();
  const parsed = projectFormSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const project = await updateProject(projectId, parsed.data);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ project });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { projectId } = await params;
  await deleteProject(projectId);
  return NextResponse.json({ ok: true });
}
