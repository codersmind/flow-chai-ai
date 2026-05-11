"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { AgentVariable, AgentVariableScope, AgentVariableType } from "@/types/project";
import { Trash2, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface VariablesManagerProps {
  projectId: string;
  initialVariables: AgentVariable[];
}

function emptyRow(): AgentVariable {
  return {
    id: `var_${nanoid(8)}`,
    name: "",
    scope: "session",
    type: "text",
    description: "",
    defaultValue: "",
  };
}

export function VariablesManager({ projectId, initialVariables }: VariablesManagerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rows, setRows] = useState<AgentVariable[]>(() =>
    initialVariables.length ? initialVariables.map((r) => ({ ...r })) : []
  );

  const variablesSeed = useMemo(() => JSON.stringify(initialVariables), [initialVariables]);
  useEffect(() => {
    const parsed = JSON.parse(variablesSeed) as AgentVariable[];
    setRows(parsed.length ? parsed.map((r) => ({ ...r })) : []);
  }, [variablesSeed]);

  const updateRow = (id: string, patch: Partial<AgentVariable>) => {
    setRows((r) => r.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeRow = (id: string) => setRows((r) => r.filter((row) => row.id !== id));
  const addRow = () => setRows((r) => [...r, emptyRow()]);

  const onSave = async () => {
    const seen = new Set<string>();
    const sanitized: AgentVariable[] = [];
    for (const row of rows) {
      const name = row.name.trim();
      if (!name) continue;
      if (seen.has(name)) {
        toast.error(`Duplicate variable name: ${name}`);
        return;
      }
      seen.add(name);
      sanitized.push({
        ...row,
        name,
        description: row.description?.trim() || undefined,
        defaultValue: row.defaultValue?.trim() || undefined,
      });
    }

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentVariables: sanitized }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: unknown };
        const msg =
          typeof j.error === "string"
            ? j.error
            : j.error
              ? JSON.stringify(j.error)
              : `Save failed (${res.status})`;
        throw new Error(msg);
      }
      toast.success("Variables saved");
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  };

  return (
    <Card className="border-muted/60">
      <CardHeader>
        <CardTitle className="text-lg">Agent variables</CardTitle>
        <CardDescription>
          Names map to runtime keys used in prompts and logic, for example{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">{"{{user_city}}"}</code>. Defaults
          are applied when the simulator starts and the key is not set yet. Use valid identifiers:
          letters, numbers, underscore; start with a letter or underscore.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs font-medium text-muted-foreground">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Scope</th>
                <th className="px-3 py-2">Default</th>
                <th className="px-3 py-2">Description</th>
                <th className="w-10 px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No variables yet. Add fields your flows will read and write, similar to Voiceflow
                    project variables.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="p-2">
                      <Input
                        value={row.name}
                        onChange={(e) => updateRow(row.id, { name: e.target.value })}
                        placeholder="user_city"
                        className="font-mono text-xs"
                      />
                    </td>
                    <td className="p-2">
                      <Select
                        value={row.type}
                        onValueChange={(v) =>
                          updateRow(row.id, { type: v as AgentVariableType })
                        }
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="boolean">Boolean</SelectItem>
                          <SelectItem value="any">Any</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Select
                        value={row.scope}
                        onValueChange={(v) =>
                          updateRow(row.id, { scope: v as AgentVariableScope })
                        }
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="session">Session</SelectItem>
                          <SelectItem value="persistent">Persistent</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Input
                        value={row.defaultValue ?? ""}
                        onChange={(e) => updateRow(row.id, { defaultValue: e.target.value })}
                        placeholder="optional"
                        className="text-xs"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={row.description ?? ""}
                        onChange={(e) => updateRow(row.id, { description: e.target.value })}
                        placeholder="Notes"
                        className="text-xs"
                      />
                    </td>
                    <td className="p-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0"
                        onClick={() => removeRow(row.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Session vs persistent labels describe intent; both currently seed defaults at simulator
          start. Restart clears runtime unless the flow writes them again.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={addRow}>
            <Plus className="mr-1 h-4 w-4" />
            Add variable
          </Button>
          <Button type="button" size="sm" className="rounded-xl" onClick={onSave} disabled={pending}>
            Save variables
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
