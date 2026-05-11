import { NextRequest, NextResponse } from "next/server";
import {
  getProject,
  listFlowsForProject,
  createProject,
  createFlow,
  updateFlow,
  updateProject,
} from "@/lib/db/repositories/projects";
import { flowExportSchema } from "@/validators/flow";
import type { FlowExportPayload } from "@/types/flow";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });
  const project = await getProject(projectId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const flows = await listFlowsForProject(projectId);
  const payload: FlowExportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    project: {
      id: project.id,
      name: project.name,
      description: project.description ?? undefined,
      defaultModel: project.defaultModel ?? undefined,
      globalInstructions: project.globalInstructions ?? undefined,
      personality: project.personality ?? undefined,
      guardrails: project.guardrails ?? undefined,
      agentVariables:
        project.agentVariables.length > 0 ? project.agentVariables : undefined,
    },
    flows: flows.map((f) => ({
      id: f.id,
      name: f.name,
      graph: JSON.parse(f.graphJson),
    })),
  };
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${project.name.replace(/[^a-z0-9]+/gi, "_")}.localvoiceflow.json"`,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = flowExportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const project = await createProject({
    name: parsed.data.project.name + " (imported)",
    description: parsed.data.project.description,
    defaultModel: parsed.data.project.defaultModel,
    globalInstructions: parsed.data.project.globalInstructions,
    personality: parsed.data.project.personality,
    guardrails: parsed.data.project.guardrails,
  });
  for (let i = 0; i < parsed.data.flows.length; i++) {
    const f = parsed.data.flows[i];
    if (i === 0) {
      // first flow already exists; replace its content
      const existing = (await listFlowsForProject(project.id))[0];
      await updateFlow(existing.id, {
        name: f.name,
        graphJson: JSON.stringify(f.graph),
      });
    } else {
      const created = await createFlow({ projectId: project.id, name: f.name });
      await updateFlow(created.id, { graphJson: JSON.stringify(f.graph) });
    }
  }
  const vars = parsed.data.project.agentVariables;
  if (vars && vars.length > 0) {
    await updateProject(project.id, { agentVariables: vars });
  }
  const updated = await getProject(project.id);
  return NextResponse.json({ project: updated ?? project }, { status: 201 });
}
