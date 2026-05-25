"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { listVoices } from "@/lib/tts/browser";
import type { AiProvider, AppSettings } from "@/types/project";

interface SettingsFormProps {
  initialSettings: AppSettings;
  initialModels: string[];
}

export function SettingsForm({ initialSettings, initialModels }: SettingsFormProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [models, setModels] = useState<string[]>(initialModels);
  const [voices, setVoices] = useState<{ name: string; lang: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [openaiKeyTouched, setOpenaiKeyTouched] = useState(false);
  const [openrouterKeyTouched, setOpenrouterKeyTouched] = useState(false);
  const skipNextProviderRefresh = useRef(true);

  useEffect(() => {
    const update = () => {
      setVoices(listVoices().map((v) => ({ name: v.name, lang: v.lang })));
    };
    update();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = update;
    }
  }, []);

  const refreshModels = async (silent?: boolean) => {
    try {
      const res = await fetch("/api/ai/models", { cache: "no-store" });
      const data = (await res.json()) as { models: string[]; provider?: AiProvider };
      setModels(data.models);
      if (!silent) {
        const label =
          data.provider === "openai"
            ? "OpenAI"
            : data.provider === "openrouter"
              ? "OpenRouter"
              : "Ollama";
        toast.success(`Loaded ${data.models.length} ${label} model(s)`);
      }
    } catch {
      if (!silent) toast.error("Failed to refresh model list");
    }
  };

  useEffect(() => {
    if (skipNextProviderRefresh.current) {
      skipNextProviderRefresh.current = false;
      return;
    }
    void refreshModels(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when provider changes
  }, [settings.aiProvider]);

  const onSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { ...settings };
      if (!openaiKeyTouched) delete body.openaiApiKey;
      if (!openrouterKeyTouched) delete body.openrouterApiKey;
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");
      const data = (await res.json()) as { settings?: AppSettings };
      if (data.settings) setSettings(data.settings);
      setOpenaiKeyTouched(false);
      setOpenrouterKeyTouched(false);
      toast.success("Settings saved");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="ai-provider">Chat / LLM provider</Label>
        <Select
          value={settings.aiProvider}
          onValueChange={(v) =>
            setSettings({ ...settings, aiProvider: v as AiProvider })
          }
        >
          <SelectTrigger id="ai-provider" className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ollama">Local Ollama</SelectItem>
            <SelectItem value="openai">OpenAI API</SelectItem>
            <SelectItem value="openrouter">OpenRouter</SelectItem>
          </SelectContent>
        </Select>
        <p className="mt-1 text-xs text-muted-foreground">
          Flow LLM nodes and the AI chat stream use this provider. Knowledge-base embeddings still use
          Ollama below.
        </p>
      </div>

      {settings.aiProvider === "openrouter" ? (
        <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
          <h2 className="text-sm font-semibold">OpenRouter</h2>
          <p className="text-xs text-muted-foreground">
            Uses the OpenAI-compatible API at{" "}
            <span className="font-mono">openrouter.ai</span> — one key for many models (Claude,
            Gemini, Llama, GPT, …).
          </p>
          <div>
            <Label htmlFor="openrouter-key">API key</Label>
            <Input
              id="openrouter-key"
              type="password"
              autoComplete="off"
              value={settings.openrouterApiKey ?? ""}
              onChange={(e) => {
                setOpenrouterKeyTouched(true);
                setSettings({ ...settings, openrouterApiKey: e.target.value || null });
              }}
              placeholder="sk-or-… or set OPENROUTER_API_KEY in .env"
            />
          </div>
          <div>
            <Label htmlFor="openrouter-model">Default model</Label>
            {models.length > 0 ? (
              <Select
                value={settings.openrouterDefaultModel}
                onValueChange={(v) => setSettings({ ...settings, openrouterDefaultModel: v })}
              >
                <SelectTrigger id="openrouter-model" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {models.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="openrouter-model"
                className="mt-1.5 font-mono text-xs"
                value={settings.openrouterDefaultModel}
                onChange={(e) =>
                  setSettings({ ...settings, openrouterDefaultModel: e.target.value })
                }
                placeholder="openai/gpt-4o-mini"
              />
            )}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void refreshModels()}>
            Reload models from OpenRouter
          </Button>
        </div>
      ) : settings.aiProvider === "openai" ? (
        <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
          <h2 className="text-sm font-semibold">OpenAI</h2>
          <div>
            <Label htmlFor="openai-key">API key</Label>
            <Input
              id="openai-key"
              type="password"
              autoComplete="off"
              value={settings.openaiApiKey ?? ""}
              onChange={(e) => {
                setOpenaiKeyTouched(true);
                setSettings({ ...settings, openaiApiKey: e.target.value || null });
              }}
              placeholder="sk-… or leave empty and set OPENAI_API_KEY in .env"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              A key is only saved when you type here. Otherwise the app keeps the stored key or
              uses <span className="font-mono">OPENAI_API_KEY</span> from the environment.
            </p>
          </div>
          <div>
            <Label htmlFor="openai-base">Base URL (optional)</Label>
            <Input
              id="openai-base"
              value={settings.openaiBaseUrl ?? ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  openaiBaseUrl: e.target.value.trim() || null,
                })
              }
              placeholder="https://api.openai.com/v1 (default when empty)"
            />
          </div>
          <div>
            <Label htmlFor="openai-model">Default model</Label>
            {models.length > 0 ? (
              <Select
                value={settings.openaiDefaultModel}
                onValueChange={(v) => setSettings({ ...settings, openaiDefaultModel: v })}
              >
                <SelectTrigger id="openai-model" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="openai-model"
                className="mt-1.5"
                value={settings.openaiDefaultModel}
                onChange={(e) =>
                  setSettings({ ...settings, openaiDefaultModel: e.target.value })
                }
                placeholder="gpt-4o-mini"
              />
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Per-flow LLM nodes can override with their own model field.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void refreshModels()}>
            Reload model list
          </Button>
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
          <h2 className="text-sm font-semibold">Ollama</h2>
          <div>
            <Label htmlFor="ollama-url">Ollama base URL</Label>
            <Input
              id="ollama-url"
              value={settings.ollamaBaseUrl}
              onChange={(e) => setSettings({ ...settings, ollamaBaseUrl: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="default-model">Default model</Label>
              {models.length > 0 ? (
                <Select
                  value={settings.ollamaDefaultModel}
                  onValueChange={(v) => setSettings({ ...settings, ollamaDefaultModel: v })}
                >
                  <SelectTrigger id="default-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="default-model"
                  value={settings.ollamaDefaultModel}
                  onChange={(e) => setSettings({ ...settings, ollamaDefaultModel: e.target.value })}
                />
              )}
            </div>
            <div>
              <Label htmlFor="embed-model">Embedding model</Label>
              <Input
                id="embed-model"
                value={settings.ollamaEmbeddingModel}
                onChange={(e) =>
                  setSettings({ ...settings, ollamaEmbeddingModel: e.target.value })
                }
              />
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void refreshModels()}>
            Refresh model list from Ollama
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="stt-lang">STT language</Label>
          <Input
            id="stt-lang"
            value={settings.sttLanguage}
            onChange={(e) => setSettings({ ...settings, sttLanguage: e.target.value })}
            placeholder="en-US"
          />
        </div>
        <div>
          <Label htmlFor="tts-voice">TTS voice</Label>
          <Select
            value={settings.ttsVoice ?? "_default"}
            onValueChange={(v) =>
              setSettings({ ...settings, ttsVoice: v === "_default" ? null : v })
            }
          >
            <SelectTrigger id="tts-voice">
              <SelectValue placeholder="Browser default" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_default">Browser default</SelectItem>
              {voices.map((v) => (
                <SelectItem key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={onSave} disabled={saving}>
        {saving ? "Saving..." : "Save settings"}
      </Button>
    </div>
  );
}
