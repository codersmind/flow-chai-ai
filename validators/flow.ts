import { z } from "zod";
import { agentVariablesPayloadSchema } from "./agent-variables";

export const flowNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.record(z.any()),
});

export const flowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().nullable().optional(),
  targetHandle: z.string().nullable().optional(),
  label: z.string().optional(),
});

export const flowGraphSchema = z.object({
  nodes: z.array(flowNodeSchema),
  edges: z.array(flowEdgeSchema),
});

export const flowExportSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  project: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    defaultModel: z.string().optional(),
    globalInstructions: z.string().optional(),
    personality: z.string().optional(),
    guardrails: z.string().optional(),
    agentVariables: agentVariablesPayloadSchema.optional(),
  }),
  flows: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      graph: flowGraphSchema,
    })
  ),
});

export type FlowGraphInput = z.infer<typeof flowGraphSchema>;
