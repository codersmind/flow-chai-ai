import "server-only";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, dbReady } from "../client";
import { projects, flows } from "../schema";
import type { Project, Flow, AgentVariable } from "@/types/project";
import { parseAgentVariablesJson } from "@/lib/variables/agent-variables";

function toProject(row: typeof projects.$inferSelect): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    defaultModel: row.defaultModel,
    globalInstructions: row.globalInstructions,
    personality: row.personality,
    guardrails: row.guardrails,
    agentVariables: parseAgentVariablesJson(row.agentVariablesJson ?? "[]"),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toFlow(row: typeof flows.$inferSelect): Flow {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    graphJson: row.graphJson,
    version: row.version,
    isStart: row.isStart,
    embedEnabled: row.embedEnabled ?? false,
    embedToken: row.embedToken ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listProjects(): Promise<Project[]> {
  await dbReady;
  const rows = await db.select().from(projects).orderBy(desc(projects.updatedAt));
  return rows.map(toProject);
}

export async function getProject(id: string): Promise<Project | null> {
  await dbReady;
  const rows = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return rows[0] ? toProject(rows[0]) : null;
}

export async function createProject(input: {
  name: string;
  description?: string;
  defaultModel?: string;
  globalInstructions?: string;
  personality?: string;
  guardrails?: string;
  agentVariables?: AgentVariable[];
}): Promise<Project> {
  await dbReady;
  const now = Date.now();
  const id = `prj_${nanoid(10)}`;
  await db.insert(projects).values({
    id,
    name: input.name,
    description: input.description ?? null,
    defaultModel: input.defaultModel ?? null,
    globalInstructions: input.globalInstructions ?? null,
    personality: input.personality ?? null,
    guardrails: input.guardrails ?? null,
    agentVariablesJson: JSON.stringify(input.agentVariables ?? []),
    createdAt: now,
    updatedAt: now,
  });

  const flowId = `flw_${nanoid(10)}`;
  const startGraph = {
    nodes: [
      {
        id: "start",
        type: "start",
        position: { x: 80, y: 200 },
        data: { label: "Start" },
      },
      {
        id: "welcome",
        type: "message",
        position: { x: 320, y: 200 },
        data: {
          label: "Welcome",
          message: "Hi! I'm your local voice assistant. How can I help today?",
        },
      },
    ],
    edges: [
      {
        id: "e_start_welcome",
        source: "start",
        target: "welcome",
      },
    ],
  };
  await db.insert(flows).values({
    id: flowId,
    projectId: id,
    name: "Main Flow",
    graphJson: JSON.stringify(startGraph),
    isStart: true,
    embedEnabled: false,
    embedToken: null,
    createdAt: now,
    updatedAt: now,
  });

  return (await getProject(id))!;
}

export async function updateProject(
  id: string,
  patch: Partial<Omit<Project, "id" | "createdAt" | "updatedAt">>
): Promise<Project | null> {
  await dbReady;
  const now = Date.now();
  const row: Partial<typeof projects.$inferInsert> = { updatedAt: now };
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.defaultModel !== undefined) row.defaultModel = patch.defaultModel;
  if (patch.globalInstructions !== undefined)
    row.globalInstructions = patch.globalInstructions;
  if (patch.personality !== undefined) row.personality = patch.personality;
  if (patch.guardrails !== undefined) row.guardrails = patch.guardrails;
  if (patch.agentVariables !== undefined) {
    row.agentVariablesJson = JSON.stringify(patch.agentVariables);
  }
  await db.update(projects).set(row).where(eq(projects.id, id));
  return getProject(id);
}

export async function deleteProject(id: string): Promise<void> {
  await dbReady;
  await db.delete(projects).where(eq(projects.id, id));
}

export async function listFlowsForProject(projectId: string): Promise<Flow[]> {
  await dbReady;
  const rows = await db
    .select()
    .from(flows)
    .where(eq(flows.projectId, projectId))
    .orderBy(desc(flows.isStart), desc(flows.updatedAt));
  return rows.map(toFlow);
}

export async function getFlow(id: string): Promise<Flow | null> {
  await dbReady;
  const rows = await db.select().from(flows).where(eq(flows.id, id)).limit(1);
  return rows[0] ? toFlow(rows[0]) : null;
}

export async function createFlow(input: {
  projectId: string;
  name: string;
}): Promise<Flow> {
  await dbReady;
  const id = `flw_${nanoid(10)}`;
  const now = Date.now();
  await db.insert(flows).values({
    id,
    projectId: input.projectId,
    name: input.name,
    graphJson: JSON.stringify({
      nodes: [
        {
          id: "start",
          type: "start",
          position: { x: 80, y: 200 },
          data: { label: "Start" },
        },
      ],
      edges: [],
    }),
    isStart: false,
    embedEnabled: false,
    embedToken: null,
    createdAt: now,
    updatedAt: now,
  });
  return (await getFlow(id))!;
}

export async function updateFlow(
  id: string,
  patch: {
    name?: string;
    graphJson?: string;
    embedEnabled?: boolean;
    embedToken?: string | null;
  }
): Promise<Flow | null> {
  await dbReady;
  const now = Date.now();
  const row: Partial<typeof flows.$inferInsert> = { updatedAt: now };
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.graphJson !== undefined) row.graphJson = patch.graphJson;
  if (patch.embedEnabled !== undefined) row.embedEnabled = patch.embedEnabled;
  if (patch.embedToken !== undefined) row.embedToken = patch.embedToken;
  await db.update(flows).set(row).where(eq(flows.id, id));
  return getFlow(id);
}

export async function deleteFlow(id: string): Promise<void> {
  await dbReady;
  await db.delete(flows).where(eq(flows.id, id));
}

export async function getStartFlow(projectId: string): Promise<Flow | null> {
  const list = await listFlowsForProject(projectId);
  return list.find((f) => f.isStart) ?? list[0] ?? null;
}
