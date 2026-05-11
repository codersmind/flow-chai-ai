import { NextRequest, NextResponse } from "next/server";
import { listProjects, createProject } from "@/lib/db/repositories/projects";
import { projectFormSchema } from "@/validators/project";

export async function GET() {
  const projects = await listProjects();
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = projectFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const { agentVariables, ...rest } = parsed.data;
  const project = await createProject({
    ...rest,
    agentVariables,
  });
  return NextResponse.json({ project }, { status: 201 });
}
