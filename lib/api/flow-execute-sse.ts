import "server-only";
import { executeFlow } from "@/lib/flow-engine/engine";
import { getProject } from "@/lib/db/repositories/projects";
import { mergeAgentVariableDefaults } from "@/lib/variables/agent-variables";
import {
  appendTraceEvent,
  createConversation,
} from "@/lib/db/repositories/conversations";
import type { FlowGraph } from "@/types/flow";
import type { SimulatorEvent } from "@/types/trace";

export type FlowExecuteJsonBody = {
  conversationId?: string;
  variables?: Record<string, unknown>;
  resumeFromNodeId?: string;
  userMessage?: string;
  conversationTranscript?: unknown;
};

function parseConversationTranscript(
  raw: unknown
): { role: "user" | "assistant" | "system"; content: string }[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const lines: { role: "user" | "assistant" | "system"; content: string }[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const role = o.role === "assistant" || o.role === "system" || o.role === "user" ? o.role : null;
    const content = typeof o.content === "string" ? o.content.trim() : "";
    if (!role || !content) continue;
    lines.push({ role, content: content.slice(0, 4000) });
  }
  return lines.slice(-32);
}

/**
 * Shared SSE stream for `/api/flows/.../execute` and `/api/embed/.../execute`.
 */
export async function createFlowSseResponse(input: {
  projectId: string;
  flowId: string;
  graph: FlowGraph;
  body: FlowExecuteJsonBody;
}): Promise<Response> {
  const { projectId, flowId, graph, body } = input;

  const conversationId =
    body.conversationId ?? (await createConversation({ projectId, flowId }));

  const project = await getProject(projectId);
  const defs = project?.agentVariables ?? [];
  const runtimeVariables: Record<string, unknown> = mergeAgentVariableDefaults(
    { ...(body.variables ?? {}) },
    defs
  );

  const conversationTranscript = parseConversationTranscript(body.conversationTranscript);

  if (typeof body.userMessage === "string" && body.userMessage.trim().length > 0) {
    const raw = body.userMessage;
    runtimeVariables.user_message = raw;
    runtimeVariables.last_user_message = raw;
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
          projectId,
          flowId,
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
