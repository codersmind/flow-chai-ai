"use client";

import { useEffect, useState } from "react";
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
import type { AppSettings } from "@/types/project";

interface SettingsFormProps {
  initialSettings: AppSettings;
  initialModels: string[];
}

export function SettingsForm({ initialSettings, initialModels }: SettingsFormProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [models, setModels] = useState<string[]>(initialModels);
  const [voices, setVoices] = useState<{ name: string; lang: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const update = () => {
      setVoices(listVoices().map((v) => ({ name: v.name, lang: v.lang })));
    };
    update();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = update;
    }
  }, []);

  const refreshModels = async () => {
    try {
      const res = await fetch("/api/ai/models", { cache: "no-store" });
      const data = (await res.json()) as { models: string[] };
      setModels(data.models);
      toast.success(`Loaded ${data.models.length} model(s)`);
    } catch {
      toast.error("Failed to refresh models");
    }
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Settings saved");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
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
              <SelectTrigger>
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
            onChange={(e) => setSettings({ ...settings, ollamaEmbeddingModel: e.target.value })}
          />
        </div>
      </div>
      <Button variant="outline" onClick={refreshModels}>
        Refresh model list from Ollama
      </Button>
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
            <SelectTrigger>
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
