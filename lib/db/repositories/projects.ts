import "server-only";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, dbReady } from "../client";
import { projects, flows } from "../schema";
import type { Project, Flow } from "@/types/project";

function toProject(row: typeof projects.$inferSelect): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    defaultModel: row.defaultModel,
    globalInstructions: row.globalInstructions,
    personality: row.personality,
    guardrails: row.guardrails,
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
  await db
    .update(projects)
    .set({ ...patch, updatedAt: now })
    .where(eq(projects.id, id));
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
    createdAt: now,
    updatedAt: now,
  });
  return (await getFlow(id))!;
}

export async function updateFlow(
  id: string,
  patch: { name?: string; graphJson?: string }
): Promise<Flow | null> {
  await dbReady;
  const now = Date.now();
  await db
    .update(flows)
    .set({ ...patch, updatedAt: now })
    .where(eq(flows.id, id));
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
