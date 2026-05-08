"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface KbSource {
  id: string;
  name: string;
  sourceType: string;
  contentLength: number;
}

interface KbManagerProps {
  projectId: string;
}

export function KbManager({ projectId }: KbManagerProps) {
  const [sources, setSources] = useState<KbSource[]>([]);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [submitting, startTransition] = useTransition();

  const load = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/kb`);
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as { sources: KbSource[] };
      setSources(data.sources);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Load failed";
      toast.error(message);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const onAdd = async () => {
    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/kb`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, content }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Add failed (${res.status})`);
        }
        toast.success("Source added & embedded");
        setName("");
        setContent("");
        await load();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Add failed";
        toast.error(message);
      }
    });
  };

  const onDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/kb?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Source removed");
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Delete failed";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded border p-3">
        <h4 className="mb-2 text-sm font-semibold">Add knowledge source</h4>
        <div className="space-y-2">
          <div>
            <Label htmlFor="kb-name">Name</Label>
            <Input id="kb-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="FAQ" />
          </div>
          <div>
            <Label htmlFor="kb-content">Content</Label>
            <Textarea
              id="kb-content"
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste plain text content here..."
            />
          </div>
          <Button onClick={onAdd} disabled={submitting}>
            {submitting ? "Embedding..." : "Add & embed"}
          </Button>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold">Sources ({sources.length})</h4>
        {sources.length === 0 ? (
          <p className="text-xs text-muted-foreground">No sources added yet.</p>
        ) : (
          <ul className="space-y-1">
            {sources.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded border bg-background px-2 py-1 text-sm"
              >
                <span>
                  {s.name}{" "}
                  <span className="text-xs text-muted-foreground">({s.contentLength} chars)</span>
                </span>
                <Button variant="ghost" size="icon" onClick={() => onDelete(s.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
