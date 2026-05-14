import { sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  index,
} from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  defaultModel: text("default_model"),
  globalInstructions: text("global_instructions"),
  personality: text("personality"),
  guardrails: text("guardrails"),
  agentVariablesJson: text("agent_variables_json").notNull().default("[]"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch() * 1000)`),
});

export const flows = sqliteTable(
  "flows",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    graphJson: text("graph_json").notNull().default("{\"nodes\":[],\"edges\":[]}"),
    version: integer("version").notNull().default(1),
    isStart: integer("is_start", { mode: "boolean" }).notNull().default(false),
    embedEnabled: integer("embed_enabled", { mode: "boolean" }).notNull().default(false),
    embedToken: text("embed_token"),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at").notNull().default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    projectIdx: index("flows_project_idx").on(table.projectId),
  })
);

export const kbSources = sqliteTable(
  "kb_sources",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sourceType: text("source_type").notNull(),
    contentLength: integer("content_length").notNull().default(0),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    projectIdx: index("kb_sources_project_idx").on(table.projectId),
  })
);

export const kbChunks = sqliteTable(
  "kb_chunks",
  {
    id: text("id").primaryKey(),
    sourceId: text("source_id")
      .notNull()
      .references(() => kbSources.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    embedding: text("embedding").notNull(),
    chunkIndex: integer("chunk_index").notNull().default(0),
  },
  (table) => ({
    projectIdx: index("kb_chunks_project_idx").on(table.projectId),
    sourceIdx: index("kb_chunks_source_idx").on(table.sourceId),
  })
);

export const conversations = sqliteTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    flowId: text("flow_id")
      .notNull()
      .references(() => flows.id, { onDelete: "cascade" }),
    variablesJson: text("variables_json").notNull().default("{}"),
    status: text("status").notNull().default("active"),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at").notNull().default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    projectIdx: index("conversations_project_idx").on(table.projectId),
  })
);

export const traceEvents = sqliteTable(
  "trace_events",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    nodeId: text("node_id"),
    nodeKind: text("node_kind"),
    level: text("level").notNull().default("info"),
    message: text("message").notNull(),
    payloadJson: text("payload_json"),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    conversationIdx: index("trace_events_conversation_idx").on(table.conversationId),
  })
);

export const appSettings = sqliteTable("app_settings", {
  id: text("id").primaryKey().default("singleton"),
  aiProvider: text("ai_provider").notNull().default("ollama"),
  ollamaBaseUrl: text("ollama_base_url").notNull().default("http://localhost:11434"),
  ollamaDefaultModel: text("ollama_default_model").notNull().default("llama3.2"),
  ollamaEmbeddingModel: text("ollama_embedding_model").notNull().default("nomic-embed-text"),
  openaiApiKey: text("openai_api_key"),
  openaiDefaultModel: text("openai_default_model").notNull().default("gpt-4o-mini"),
  openaiBaseUrl: text("openai_base_url"),
  ttsVoice: text("tts_voice"),
  sttLanguage: text("stt_language").notNull().default("en-US"),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch() * 1000)`),
});

export type ProjectRow = typeof projects.$inferSelect;
export type FlowRow = typeof flows.$inferSelect;
export type ConversationRow = typeof conversations.$inferSelect;
export type TraceEventRow = typeof traceEvents.$inferSelect;
export type AppSettingsRow = typeof appSettings.$inferSelect;
