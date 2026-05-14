import { notFound } from "next/navigation";
import { getFlow, listFlowsForProject, getProject } from "@/lib/db/repositories/projects";
import { BuilderShell } from "./builder-shell";
import type { Node, Edge } from "@xyflow/react";

interface PageProps {
  params: Promise<{ projectId: string; flowId: string }>;
}

export default async function FlowBuilderPage({ params }: PageProps) {
  const { projectId, flowId } = await params;
  const [flow, project] = await Promise.all([getFlow(flowId), getProject(projectId)]);
  if (!flow || flow.projectId !== projectId || !project) notFound();

  let initialNodes: Node[] = [];
  let initialEdges: Edge[] = [];
  try {
    const parsed = JSON.parse(flow.graphJson) as { nodes: Node[]; edges: Edge[] };
    initialNodes = parsed.nodes ?? [];
    initialEdges = parsed.edges ?? [];
  } catch {
    /* keep empty */
  }

  const flows = await listFlowsForProject(projectId);

  return (
    <BuilderShell
      projectId={projectId}
      flowId={flowId}
      flowName={flow.name}
      embedEnabled={flow.embedEnabled}
      embedToken={flow.embedToken}
      graphRevision={flow.updatedAt}
      flows={flows.map((f) => ({ id: f.id, name: f.name }))}
      initialNodes={initialNodes}
      initialEdges={initialEdges}
      agentVariables={project.agentVariables}
    />
  );
}
