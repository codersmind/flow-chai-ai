import { z } from "zod";
import { agentVariablesPayloadSchema } from "./agent-variables";

export const projectFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(500).optional(),
  defaultModel: z.string().max(120).optional(),
  globalInstructions: z.string().max(8000).optional(),
  personality: z.string().max(2000).optional(),
  guardrails: z.string().max(2000).optional(),
  agentVariables: agentVariablesPayloadSchema.optional(),
});

export type ProjectFormInput = z.infer<typeof projectFormSchema>;
