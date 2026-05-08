"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Project } from "@/types/project";

interface ProjectSettingsFormProps {
  project: Project;
}

export function ProjectSettingsForm({ project }: ProjectSettingsFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: project.name,
    description: project.description ?? "",
    defaultModel: project.defaultModel ?? "",
    globalInstructions: project.globalInstructions ?? "",
    personality: project.personality ?? "",
    guardrails: project.guardrails ?? "",
  });

  const update = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const onSave = async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      toast.success("Project saved");
      startTransition(() => router.refresh());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      toast.error(message);
    }
  };

  const onDelete = async () => {
    if (!confirm(`Delete project "${project.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Project deleted");
      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Delete failed";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="p-name">Name</Label>
        <Input id="p-name" value={form.name} onChange={(e) => update({ name: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="p-desc">Description</Label>
        <Textarea
          id="p-desc"
          rows={2}
          value={form.description}
          onChange={(e) => update({ description: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="p-model">Default model</Label>
        <Input
          id="p-model"
          value={form.defaultModel}
          onChange={(e) => update({ defaultModel: e.target.value })}
          placeholder="llama3.2"
        />
      </div>
      <div>
        <Label htmlFor="p-inst">Global instructions</Label>
        <Textarea
          id="p-inst"
          rows={4}
          value={form.globalInstructions}
          onChange={(e) => update({ globalInstructions: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="p-pers">Personality</Label>
        <Textarea
          id="p-pers"
          rows={3}
          value={form.personality}
          onChange={(e) => update({ personality: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="p-guards">Guardrails</Label>
        <Textarea
          id="p-guards"
          rows={3}
          value={form.guardrails}
          onChange={(e) => update({ guardrails: e.target.value })}
        />
      </div>
      <div className="flex justify-between pt-2">
        <Button variant="destructive" onClick={onDelete} disabled={pending}>
          Delete project
        </Button>
        <Button onClick={onSave} disabled={pending}>
          Save changes
        </Button>
      </div>
    </div>
  );
}
