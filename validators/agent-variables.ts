import { z } from "zod";

export const agentVariableDefSchema = z.object({
  id: z.string().min(1).max(40),
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(
      /^[a-zA-Z_][a-zA-Z0-9_]*$/,
      "Name must be a valid identifier (letters, numbers, underscore)"
    ),
  scope: z.enum(["session", "persistent"]),
  type: z.enum(["text", "number", "boolean", "any"]),
  description: z.string().max(500).optional(),
  defaultValue: z.string().max(2000).optional(),
});

export const agentVariablesPayloadSchema = z.array(agentVariableDefSchema).max(100);
