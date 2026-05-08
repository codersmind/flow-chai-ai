# LocalVoiceFlow

A lightweight, fully local, self-hosted React/Next.js clone of Voiceflow with strong feature parity. Runs entirely on your machine — Ollama for LLM, browser APIs for voice, SQLite for persistence.

## Features

- Visual flow builder powered by React Flow
- Comprehensive node types: Message, Capture, Choice, Condition, Set Variable, LLM, Knowledge Base Search, API Call, Subflow, End
- Local LLM via Ollama (streaming, tool calling, JSON mode)
- Local RAG / Knowledge Base via LangChain.js + Ollama embeddings
- Browser-native STT (MediaRecorder + Web Speech API) and TTS (SpeechSynthesis)
- Live simulator with text + voice modes, variable inspector and trace logs
- Project / agent management with global instructions, personality, guardrails
- JSON import/export of projects
- Settings page for Ollama host, default model, voice preferences

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Make sure Ollama is running locally (https://ollama.com)
ollama serve
ollama pull llama3.2
ollama pull nomic-embed-text

# 3. Initialize the database
npm run db:generate
npm run db:migrate

# 4. Start the dev server
npm run dev
```

Open http://localhost:3000.

## Tech Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS + shadcn/ui + Radix
- React Flow (`@xyflow/react`)
- Zustand state management
- Vercel AI SDK + `ollama-ai-provider`
- LangChain.js for RAG
- SQLite via Drizzle ORM (`better-sqlite3`)
- React Hook Form + Zod

## Project Structure

```
app/                  Next.js App Router pages and API routes
components/           React Flow nodes, simulator UI, project forms
  flow/               Canvas, inspector, node renderers, comments
  simulator/          Chat panel, voice controls, variable inspector, trace log
  projects/           Project/agent settings editors
lib/
  ai/                 Ollama provider + streaming adapters
  flow-engine/        Node executor registry + runtime context
  rag/                Embeddings, retrieval, KB indexing
  stt/  tts/          Browser + server speech adapters
  db/                 Drizzle schema, client, migrations, repositories
stores/               Zustand stores (canvas, runtime, simulator, UI)
types/                Typed node contracts, models, traces
validators/           Zod schemas for flows, projects, settings
```

## Environment

Configure `.env.local`:

```
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=llama3.2
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
DATABASE_URL=./localvoiceflow.db
```
