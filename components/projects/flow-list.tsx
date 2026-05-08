"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { Flow } from "@/types/project";

interface FlowListProps {
  projectId: string;
  flows: Flow[];
}

export function FlowList({ projectId, flows }: FlowListProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const onCreate = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/flows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Create failed");
      const { flow } = (await res.json()) as { flow: Flow };
      toast.success("Flow created");
      setOpen(false);
      setName("");
      router.push(`/projects/${projectId}/flows/${flow.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Create failed";
      toast.error(message);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this flow?")) return;
    try {
      const res = await fetch(`/api/flows/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Flow deleted");
      startTransition(() => router.refresh());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Delete failed";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Flows</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="mr-1 h-3.5 w-3.5" />
              New flow
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New flow</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Flow name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <DialogFooter>
              <Button onClick={onCreate} disabled={!name.trim()}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <ul className="space-y-1">
        {flows.map((f) => (
          <li
            key={f.id}
            className="flex items-center justify-between rounded border bg-background px-2 py-1 text-sm"
          >
            <Link
              href={`/projects/${projectId}/flows/${f.id}`}
              className="flex-1 truncate hover:underline"
            >
              {f.name} {f.isStart ? <span className="text-xs text-muted-foreground">(start)</span> : null}
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(f.id)}
              disabled={f.isStart}
              title={f.isStart ? "Cannot delete start flow" : "Delete flow"}
            >
              Delete
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
