import { AppNav } from "@/components/layout/app-nav";
import { getSettings } from "@/lib/db/repositories/settings";
import { listOllamaModels } from "@/lib/ai/ollama";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const [settings, models] = await Promise.all([getSettings(), listOllamaModels()]);
  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="mb-1 text-2xl font-semibold">Settings</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Use local Ollama or an OpenAI-compatible API key for chat and flow LLM steps. Voice and
          embeddings still use your local Ollama URL when you pick OpenAI for chat.
        </p>
        <SettingsForm initialSettings={settings} initialModels={models} />
      </main>
    </div>
  );
}
