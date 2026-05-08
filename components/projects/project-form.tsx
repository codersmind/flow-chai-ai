"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { projectFormSchema, type ProjectFormInput } from "@/validators/project";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function NewProjectButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm<ProjectFormInput>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      defaultModel: "",
      globalInstructions: "",
      personality: "",
      guardrails: "",
    },
  });

  const onSubmit = async (values: ProjectFormInput) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(`Create failed (${res.status})`);
      const { project } = (await res.json()) as { project: { id: string } };
      toast.success("Project created");
      setOpen(false);
      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Create failed";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>Define your agent.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name ? (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={2} {...form.register("description")} />
          </div>
          <div>
            <Label htmlFor="defaultModel">Default model</Label>
            <Input id="defaultModel" {...form.register("defaultModel")} placeholder="llama3.2" />
          </div>
          <div>
            <Label htmlFor="globalInstructions">Global instructions</Label>
            <Textarea id="globalInstructions" rows={3} {...form.register("globalInstructions")} />
          </div>
          <div>
            <Label htmlFor="personality">Personality</Label>
            <Textarea id="personality" rows={2} {...form.register("personality")} />
          </div>
          <div>
            <Label htmlFor="guardrails">Guardrails</Label>
            <Textarea id="guardrails" rows={2} {...form.register("guardrails")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
