import { NextRequest } from "next/server";
import { executeFlow } from "@/lib/flow-engine/engine";
import { getFlow, getProject } from "@/lib/db/repositories/projects";
import { mergeAgentVariableDefaults } from "@/lib/variables/agent-variables";
import {
  appendTraceEvent,
  createConversation,
} from "@/lib/db/repositories/conversations";
import type { FlowGraph } from "@/types/flow";
import type { SimulatorEvent } from "@/types/trace";

interface RouteParams {
  params: Promise<{ flowId: string }>;
}

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { flowId } = await params;
  const body = (await req.json()) as {
    conversationId?: string;
    variables?: Record<string, unknown>;
    resumeFromNodeId?: string;
    userMessage?: string;
    conversationTranscript?: unknown;
  };

  const flow = await getFlow(flowId);
  if (!flow) {
    return new Response(JSON.stringify({ error: "Flow not found" }), {
      status: 404,
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

  const conversationId =
    body.conversationId ??
    (await createConversation({ projectId: flow.projectId, flowId: flow.id }));

  const project = await getProject(flow.projectId);
  const defs = project?.agentVariables ?? [];
  const runtimeVariables: Record<string, unknown> = mergeAgentVariableDefaults(
    { ...(body.variables ?? {}) },
    defs
  );

  let conversationTranscript:
    | { role: "user" | "assistant" | "system"; content: string }[]
    | undefined;
  if (Array.isArray(body.conversationTranscript)) {
    const lines: { role: "user" | "assistant" | "system"; content: string }[] = [];
    for (const item of body.conversationTranscript) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const role = o.role === "assistant" || o.role === "system" || o.role === "user" ? o.role : null;
      const content = typeof o.content === "string" ? o.content.trim() : "";
      if (!role || !content) continue;
      lines.push({ role, content: content.slice(0, 4000) });
    }
    conversationTranscript = lines.slice(-32);
  }
  if (typeof body.userMessage === "string" && body.userMessage.trim().length > 0) {
    const raw = body.userMessage;
    runtimeVariables.user_message = raw;
    runtimeVariables.last_user_message = raw;
    /** Voiceflow-style alias for the latest user line (Listen / last reply). */
    runtimeVariables.last_utterance = raw;
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SimulatorEvent) => {
        const line = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(line));
      };
      try {
        send({
          kind: "trace",
          trace: {
            id: `trc_${Date.now()}`,
            conversationId,
            nodeId: null,
            nodeKind: null,
            level: "info",
            message: body.resumeFromNodeId
              ? `Resuming flow at ${body.resumeFromNodeId}`
              : "Starting flow execution",
            createdAt: Date.now(),
          },
        });

        const result = await executeFlow({
          projectId: flow.projectId,
          flowId: flow.id,
          conversationId,
          graph,
          variables: runtimeVariables,
          resumeFromNodeId: body.resumeFromNodeId,
          userMessage: body.userMessage,
          conversationTranscript,
          onEvent: async (event) => {
            send(event);
            if (event.kind === "trace") {
              try {
                await appendTraceEvent({
                  conversationId,
                  nodeId: event.trace.nodeId,
                  nodeKind: event.trace.nodeKind,
                  level: event.trace.level,
                  message: event.trace.message,
                });
              } catch {
                /* swallow */
              }
            }
          },
        });

        send({
          kind: "trace",
          trace: {
            id: `trc_${Date.now()}`,
            conversationId,
            nodeId: null,
            nodeKind: null,
            level: "info",
            message: result.awaitingNodeId
              ? `Awaiting input at ${result.awaitingNodeId}`
              : "Execution complete",
            payload: result.variables,
            createdAt: Date.now(),
          },
        });
        controller.enqueue(
          encoder.encode(
            `event: done\ndata: ${JSON.stringify({
              conversationId,
              awaitingNodeId: result.awaitingNodeId,
              variables: result.variables,
              endReason: result.endReason,
            })}\n\n`
          )
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Execution error";
        send({ kind: "error", error: errorMessage });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
