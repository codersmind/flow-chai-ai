import { z } from "zod";

const optionalUrlOrEmpty = z.preprocess(
  (v) => (v === "" ? null : v),
  z.union([z.string().url(), z.null()]).optional()
);

export const settingsSchema = z.object({
  aiProvider: z.enum(["ollama", "openai"]),
  ollamaBaseUrl: z.string().url(),
  ollamaDefaultModel: z.string().min(1),
  ollamaEmbeddingModel: z.string().min(1),
  openaiApiKey: z.string().nullable().optional(),
  openaiDefaultModel: z.string().min(1),
  openaiBaseUrl: optionalUrlOrEmpty,
  ttsVoice: z.string().nullable(),
  sttLanguage: z.string().min(2),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

export const settingsPatchSchema = z.object({
  aiProvider: z.enum(["ollama", "openai"]).optional(),
  ollamaBaseUrl: z.string().url().optional(),
  ollamaDefaultModel: z.string().min(1).optional(),
  ollamaEmbeddingModel: z.string().min(1).optional(),
  openaiApiKey: z.string().nullable().optional(),
  openaiDefaultModel: z.string().min(1).optional(),
  openaiBaseUrl: optionalUrlOrEmpty,
  ttsVoice: z.string().nullable().optional(),
  sttLanguage: z.string().min(2).optional(),
});
