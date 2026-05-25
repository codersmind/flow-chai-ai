import "server-only";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import path from "node:path";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __lvf_db__: ReturnType<typeof drizzle> | undefined;
  // eslint-disable-next-line no-var
  var __lvf_db_ready__: Promise<void> | undefined;
}

const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), "localvoiceflow.db");
const dbUrl = dbPath.startsWith("file:") ? dbPath : `file:${dbPath.replace(/\\/g, "/")}`;

async function ensureSchema(client: ReturnType<typeof createClient>) {
  const statements = [
    "PRAGMA journal_mode = WAL;",
    "PRAGMA foreign_keys = ON;",
    `
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      default_model TEXT,
      global_instructions TEXT,
      personality TEXT,
      guardrails TEXT,
      agent_variables_json TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
    CREATE TABLE IF NOT EXISTS flows (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      graph_json TEXT NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
      version INTEGER NOT NULL DEFAULT 1,
      is_start INTEGER NOT NULL DEFAULT 0,
      embed_enabled INTEGER NOT NULL DEFAULT 0,
      embed_token TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
    CREATE INDEX IF NOT EXISTS flows_project_idx ON flows(project_id);
    CREATE TABLE IF NOT EXISTS kb_sources (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      source_type TEXT NOT NULL,
      content_length INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
    CREATE INDEX IF NOT EXISTS kb_sources_project_idx ON kb_sources(project_id);
    CREATE TABLE IF NOT EXISTS kb_chunks (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL REFERENCES kb_sources(id) ON DELETE CASCADE,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      embedding TEXT NOT NULL,
      chunk_index INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS kb_chunks_project_idx ON kb_chunks(project_id);
    CREATE INDEX IF NOT EXISTS kb_chunks_source_idx ON kb_chunks(source_id);
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      flow_id TEXT NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
      variables_json TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'active',
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
    CREATE INDEX IF NOT EXISTS conversations_project_idx ON conversations(project_id);
    CREATE TABLE IF NOT EXISTS trace_events (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      node_id TEXT,
      node_kind TEXT,
      level TEXT NOT NULL DEFAULT 'info',
      message TEXT NOT NULL,
      payload_json TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
    CREATE INDEX IF NOT EXISTS trace_events_conversation_idx ON trace_events(conversation_id);
    CREATE TABLE IF NOT EXISTS app_settings (
      id TEXT PRIMARY KEY DEFAULT 'singleton',
      ai_provider TEXT NOT NULL DEFAULT 'ollama',
      ollama_base_url TEXT NOT NULL DEFAULT 'http://localhost:11434',
      ollama_default_model TEXT NOT NULL DEFAULT 'llama3.2',
      ollama_embedding_model TEXT NOT NULL DEFAULT 'nomic-embed-text',
      openai_api_key TEXT,
      openai_default_model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
      openai_base_url TEXT,
      tts_voice TEXT,
      stt_language TEXT NOT NULL DEFAULT 'en-US',
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
    INSERT OR IGNORE INTO app_settings (id) VALUES ('singleton');
  `,
  ];

  for (const stmt of statements) {
    await client.execute(stmt);
  }

  const col = await client.execute(
    "SELECT COUNT(*) AS c FROM pragma_table_info('projects') WHERE name = 'agent_variables_json'"
  );
  const row = col.rows[0] as unknown as { c: number } | undefined;
  if (!row || Number(row.c) === 0) {
    await client.execute(
      "ALTER TABLE projects ADD COLUMN agent_variables_json TEXT NOT NULL DEFAULT '[]'"
    );
  }

  const appCols: { name: string; ddl: string }[] = [
    {
      name: "ai_provider",
      ddl: "ALTER TABLE app_settings ADD COLUMN ai_provider TEXT NOT NULL DEFAULT 'ollama'",
    },
    { name: "openai_api_key", ddl: "ALTER TABLE app_settings ADD COLUMN openai_api_key TEXT" },
    {
      name: "openai_default_model",
      ddl: "ALTER TABLE app_settings ADD COLUMN openai_default_model TEXT NOT NULL DEFAULT 'gpt-4o-mini'",
    },
    { name: "openai_base_url", ddl: "ALTER TABLE app_settings ADD COLUMN openai_base_url TEXT" },
    { name: "openrouter_api_key", ddl: "ALTER TABLE app_settings ADD COLUMN openrouter_api_key TEXT" },
    {
      name: "openrouter_default_model",
      ddl: "ALTER TABLE app_settings ADD COLUMN openrouter_default_model TEXT NOT NULL DEFAULT 'openai/gpt-4o-mini'",
    },
  ];
  for (const col of appCols) {
    const pr = await client.execute(
      `SELECT COUNT(*) AS c FROM pragma_table_info('app_settings') WHERE name = '${col.name}'`
    );
    const prRow = pr.rows[0] as unknown as { c: number } | undefined;
    if (!prRow || Number(prRow.c) === 0) {
      await client.execute(col.ddl);
    }
  }

  const flowEmbedCols: { name: string; ddl: string }[] = [
    {
      name: "embed_enabled",
      ddl: "ALTER TABLE flows ADD COLUMN embed_enabled INTEGER NOT NULL DEFAULT 0",
    },
    { name: "embed_token", ddl: "ALTER TABLE flows ADD COLUMN embed_token TEXT" },
  ];
  for (const col of flowEmbedCols) {
    const pr = await client.execute(
      `SELECT COUNT(*) AS c FROM pragma_table_info('flows') WHERE name = '${col.name}'`
    );
    const prRow = pr.rows[0] as unknown as { c: number } | undefined;
    if (!prRow || Number(prRow.c) === 0) {
      await client.execute(col.ddl);
    }
  }
}

function buildClient() {
  const client = createClient({
    url: dbUrl,
  });
  const db = drizzle(client, { schema });
  const ready = ensureSchema(client);
  return { db, ready };
}

let cached = global.__lvf_db__;
if (!cached) {
  const { db, ready } = buildClient();
  global.__lvf_db__ = db;
  global.__lvf_db_ready__ = ready;
  cached = db;
}

export const db = cached!;
export const dbReady = global.__lvf_db_ready__!;
