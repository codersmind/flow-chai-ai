export interface Project {
  id: string;
  name: string;
  description: string | null;
  defaultModel: string | null;
  globalInstructions: string | null;
  personality: string | null;
  guardrails: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Flow {
  id: string;
  projectId: string;
  name: string;
  graphJson: string;
  version: number;
  isStart: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  ollamaBaseUrl: string;
  ollamaDefaultModel: string;
  ollamaEmbeddingModel: string;
  ttsVoice: string | null;
  sttLanguage: string;
}
