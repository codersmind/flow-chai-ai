import { NextRequest } from "next/server";
import { getFlow } from "@/lib/db/repositories/projects";
import { createFlowSseResponse, type FlowExecuteJsonBody } from "@/lib/api/flow-execute-sse";
import type { FlowGraph } from "@/types/flow";

interface RouteParams {
  params: Promise<{ flowId: string }>;
}

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { flowId } = await params;
  const body = (await req.json()) as FlowExecuteJsonBody & { embedToken?: string };

  const flow = await getFlow(flowId);
  if (!flow) {
    return new Response(JSON.stringify({ error: "Flow not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!flow.embedEnabled || !flow.embedToken) {
    return new Response(JSON.stringify({ error: "Embed not enabled for this flow" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = typeof body.embedToken === "string" ? body.embedToken.trim() : "";
  if (!token || token !== flow.embedToken) {
    return new Response(JSON.stringify({ error: "Invalid embed token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let graph: FlowGraph;
  try {
    graph = JSON.parse(flow.graphJson) as FlowGraph;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid graph JSON" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { embedToken: _omit, ...rest } = body;
  return createFlowSseResponse({
    projectId: flow.projectId,
    flowId: flow.id,
    graph,
    body: rest,
  });
}
