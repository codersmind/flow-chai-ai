import "server-only";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, dbReady } from "../client";
import { conversations, traceEvents } from "../schema";

export async function createConversation(input: {
  projectId: string;
  flowId: string;
}): Promise<string> {
  await dbReady;
  const id = `cnv_${nanoid(10)}`;
  await db.insert(conversations).values({
    id,
    projectId: input.projectId,
    flowId: input.flowId,
  });
  return id;
}

export async function listConversations(projectId: string) {
  await dbReady;
  return db
    .select()
    .from(conversations)
    .where(eq(conversations.projectId, projectId))
    .orderBy(desc(conversations.createdAt));
}

export async function appendTraceEvent(input: {
  conversationId: string;
  nodeId?: string | null;
  nodeKind?: string | null;
  level?: "info" | "debug" | "warn" | "error";
  message: string;
  payload?: unknown;
}): Promise<void> {
  await dbReady;
  await db.insert(traceEvents).values({
    id: `evt_${nanoid(10)}`,
    conversationId: input.conversationId,
    nodeId: input.nodeId ?? null,
    nodeKind: input.nodeKind ?? null,
    level: input.level ?? "info",
    message: input.message,
    payloadJson: input.payload ? JSON.stringify(input.payload) : null,
  });
}

export async function getTraceEvents(conversationId: string) {
  await dbReady;
  return db
    .select()
    .from(traceEvents)
    .where(eq(traceEvents.conversationId, conversationId))
    .orderBy(desc(traceEvents.createdAt));
}
