export type AgentVariableScope = "session" | "persistent";
export type AgentVariableType = "text" | "number" | "boolean" | "any";

export interface AgentVariable {
  id: string;
  name: string;
  scope: AgentVariableScope;
  type: AgentVariableType;
  description?: string;
  defaultValue?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  defaultModel: string | null;
  globalInstructions: string | null;
  personality: string | null;
  guardrails: string | null;
  agentVariables: AgentVariable[];
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

export type AiProvider = "ollama" | "openai";

export interface AppSettings {
  aiProvider: AiProvider;
  ollamaBaseUrl: string;
  ollamaDefaultModel: string;
  ollamaEmbeddingModel: string;
  /** Stored in DB for local use; falls back to `OPENAI_API_KEY` env when empty. */
  openaiApiKey: string | null;
  openaiDefaultModel: string;
  /** Optional (e.g. Azure OpenAI proxy). Leave empty for api.openai.com. */
  openaiBaseUrl: string | null;
  ttsVoice: string | null;
  sttLanguage: string;
}
