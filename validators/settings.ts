import { z } from "zod";

export const settingsSchema = z.object({
  ollamaBaseUrl: z.string().url(),
  ollamaDefaultModel: z.string().min(1),
  ollamaEmbeddingModel: z.string().min(1),
  ttsVoice: z.string().nullable(),
  sttLanguage: z.string().min(2),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
