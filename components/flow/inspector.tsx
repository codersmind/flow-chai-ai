"use client";

import { useMemo } from "react";
import { useCanvasStore } from "@/stores/canvas-store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Plus, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import type {
  ApiCallNodeData,
  CaptureNodeData,
  ChoiceNodeData,
  ConditionNodeData,
  ConditionRule,
  KbSearchNodeData,
  LlmNodeData,
  MessageNodeData,
  SetVariableNodeData,
  SubflowNodeData,
} from "@/types/flow";

export function FlowInspector() {
  const { nodes, selectedNodeId, updateNodeData, removeNode } = useCanvasStore();
  const node = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );

  if (!node) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
        <p>Select a node to edit it.</p>
        <p className="text-xs">Drag from the palette or use the buttons to add new nodes.</p>
      </div>
    );
  }

  const data = node.data as unknown as Record<string, unknown>;
  const update = (patch: Record<string, unknown>) => updateNodeData(node.id, patch);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{node.type}</p>
          <p className="text-sm font-semibold tracking-tight">{(data.label as string) || node.id}</p>
        </div>
        {node.type !== "start" ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeNode(node.id)}
            title="Delete node"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          <div>
            <Label htmlFor="node-label">Label</Label>
            <Input
              id="node-label"
              value={(data.label as string) ?? ""}
              onChange={(e) => update({ label: e.target.value })}
            />
          </div>

          {node.type === "message" ? <MessageEditor data={data as unknown as MessageNodeData} update={update} /> : null}
          {node.type === "capture" ? <CaptureEditor data={data as unknown as CaptureNodeData} update={update} /> : null}
          {node.type === "choice" ? <ChoiceEditor data={data as unknown as ChoiceNodeData} update={update} /> : null}
          {node.type === "condition" ? <ConditionEditor data={data as unknown as ConditionNodeData} update={update} /> : null}
          {node.type === "set_variable" ? <SetVariableEditor data={data as unknown as SetVariableNodeData} update={update} /> : null}
          {node.type === "llm" ? <LlmEditor data={data as unknown as LlmNodeData} update={update} /> : null}
          {node.type === "kb_search" ? <KbSearchEditor data={data as unknown as KbSearchNodeData} update={update} /> : null}
          {node.type === "api_call" ? <ApiCallEditor data={data as unknown as ApiCallNodeData} update={update} /> : null}
          {node.type === "subflow" ? <SubflowEditor data={data as unknown as SubflowNodeData} update={update} /> : null}
        </div>
      </div>
    </div>
  );
}

function MessageEditor({ data, update }: { data: MessageNodeData; update: (p: Record<string, unknown>) => void }) {
  return (
    <div>
      <Label>Message</Label>
      <Textarea
        rows={6}
        value={data.message ?? ""}
        onChange={(e) => update({ message: e.target.value })}
        placeholder="Hello! Use {{variables}} for interpolation."
      />
    </div>
  );
}

function CaptureEditor({ data, update }: { data: CaptureNodeData; update: (p: Record<string, unknown>) => void }) {
  return (
    <>
      <div>
        <Label>Prompt</Label>
        <Textarea
          rows={3}
          value={data.prompt ?? ""}
          onChange={(e) => update({ prompt: e.target.value })}
        />
      </div>
      <div>
        <Label>Variable to capture into</Label>
        <Input
          value={data.variable ?? ""}
          onChange={(e) => update({ variable: e.target.value })}
          placeholder="user_input"
        />
      </div>
      <div>
        <Label>Suggested replies (one per line)</Label>
        <Textarea
          rows={3}
          value={(data.suggestedReplies ?? []).join("\n")}
          onChange={(e) =>
            update({ suggestedReplies: e.target.value.split(/\n+/).filter(Boolean) })
          }
        />
      </div>
    </>
  );
}

function ChoiceEditor({ data, update }: { data: ChoiceNodeData; update: (p: Record<string, unknown>) => void }) {
  return (
    <>
      <div>
        <Label>Prompt</Label>
        <Textarea
          rows={3}
          value={data.prompt ?? ""}
          onChange={(e) => update({ prompt: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Options</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              update({
                options: [
                  ...(data.options ?? []),
                  { id: `opt_${nanoid(4)}`, label: "New option" },
                ],
              })
            }
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add
          </Button>
        </div>
        {(data.options ?? []).map((opt, i) => (
          <div key={opt.id} className="flex items-center gap-2">
            <Input
              value={opt.label}
              onChange={(e) => {
                const options = [...(data.options ?? [])];
                options[i] = { ...opt, label: e.target.value };
                update({ options });
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const options = (data.options ?? []).filter((o) => o.id !== opt.id);
                update({ options });
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}

function ConditionEditor({ data, update }: { data: ConditionNodeData; update: (p: Record<string, unknown>) => void }) {
  return (
    <>
      <Tabs
        value={data.mode ?? "rules"}
        onValueChange={(v) => update({ mode: v as "rules" | "llm_router" })}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="llm_router">LLM Router</TabsTrigger>
        </TabsList>
        <TabsContent value="rules">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Rules</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const id = `r_${nanoid(4)}`;
                  update({
                    rules: [
                      ...(data.rules ?? []),
                      { id, variable: "", operator: "equals", value: "" },
                    ],
                    routes: [
                      ...(data.routes ?? []),
                      { id, label: `Rule ${id}` },
                    ],
                  });
                }}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add
              </Button>
            </div>
            {(data.rules ?? []).map((rule: ConditionRule, i) => (
              <div key={rule.id} className="grid grid-cols-12 gap-1 rounded border p-2">
                <Input
                  className="col-span-4"
                  placeholder="variable"
                  value={rule.variable}
                  onChange={(e) => {
                    const rules = [...(data.rules ?? [])];
                    rules[i] = { ...rule, variable: e.target.value };
                    update({ rules });
                  }}
                />
                <Select
                  value={rule.operator}
                  onValueChange={(v) => {
                    const rules = [...(data.rules ?? [])];
                    rules[i] = { ...rule, operator: v as ConditionRule["operator"] };
                    update({ rules });
                  }}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">equals</SelectItem>
                    <SelectItem value="not_equals">not equals</SelectItem>
                    <SelectItem value="contains">contains</SelectItem>
                    <SelectItem value="gt">&gt;</SelectItem>
                    <SelectItem value="lt">&lt;</SelectItem>
                    <SelectItem value="is_empty">is empty</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  className="col-span-4"
                  placeholder="value"
                  value={rule.value}
                  onChange={(e) => {
                    const rules = [...(data.rules ?? [])];
                    rules[i] = { ...rule, value: e.target.value };
                    update({ rules });
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="col-span-1"
                  onClick={() => {
                    const rules = (data.rules ?? []).filter((r) => r.id !== rule.id);
                    const routes = (data.routes ?? []).filter((r) => r.id !== rule.id);
                    update({ rules, routes });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              An &quot;else&quot; route is always available via the handle id <code>else</code>.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="llm_router">
          <div className="space-y-2">
            <Label>Classifier prompt</Label>
            <Textarea
              rows={4}
              value={data.llmPrompt ?? ""}
              onChange={(e) => update({ llmPrompt: e.target.value })}
              placeholder="User says: {{user_message}}"
            />
            <Label>Routes</Label>
            {(data.routes ?? []).map((r, i) => (
              <div key={r.id} className="flex items-center gap-2">
                <Input
                  value={r.label}
                  onChange={(e) => {
                    const routes = [...(data.routes ?? [])];
                    routes[i] = { ...r, label: e.target.value };
                    update({ routes });
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const routes = (data.routes ?? []).filter((x) => x.id !== r.id);
                    update({ routes });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                update({
                  routes: [
                    ...(data.routes ?? []),
                    { id: `route_${nanoid(4)}`, label: "New route" },
                  ],
                })
              }
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add route
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

function SetVariableEditor({ data, update }: { data: SetVariableNodeData; update: (p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-2">
      <Label>Assignments</Label>
      {(data.assignments ?? []).map((a, i) => (
        <div key={a.id} className="grid grid-cols-12 gap-1">
          <Input
            className="col-span-5"
            placeholder="variable"
            value={a.variable}
            onChange={(e) => {
              const assignments = [...(data.assignments ?? [])];
              assignments[i] = { ...a, variable: e.target.value };
              update({ assignments });
            }}
          />
          <Input
            className="col-span-6"
            placeholder="value (supports {{var}})"
            value={a.value}
            onChange={(e) => {
              const assignments = [...(data.assignments ?? [])];
              assignments[i] = { ...a, value: e.target.value };
              update({ assignments });
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="col-span-1"
            onClick={() => {
              const assignments = (data.assignments ?? []).filter((x) => x.id !== a.id);
              update({ assignments });
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          update({
            assignments: [
              ...(data.assignments ?? []),
              { id: `a_${nanoid(4)}`, variable: "", value: "" },
            ],
          })
        }
      >
        <Plus className="mr-1 h-3.5 w-3.5" />
        Add assignment
      </Button>
    </div>
  );
}

function LlmEditor({ data, update }: { data: LlmNodeData; update: (p: Record<string, unknown>) => void }) {
  return (
    <>
      <div>
        <Label>System prompt</Label>
        <Textarea
          rows={3}
          value={data.systemPrompt ?? ""}
          onChange={(e) => update({ systemPrompt: e.target.value })}
        />
      </div>
      <div>
        <Label>User prompt</Label>
        <Textarea
          rows={4}
          value={data.userPrompt ?? ""}
          onChange={(e) => update({ userPrompt: e.target.value })}
          placeholder="Use {{variables}} for context"
        />
      </div>
      <div>
        <Label>Model (optional)</Label>
        <Input
          value={data.model ?? ""}
          onChange={(e) => update({ model: e.target.value })}
          placeholder="llama3.2 (uses default if empty)"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Temperature</Label>
          <Input
            type="number"
            step="0.1"
            min={0}
            max={2}
            value={data.temperature ?? 0.7}
            onChange={(e) => update({ temperature: Number(e.target.value) })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label>JSON mode</Label>
          <Switch
            checked={!!data.jsonMode}
            onCheckedChange={(v) => update({ jsonMode: !!v })}
          />
        </div>
      </div>
      <div>
        <Label>Output variable (optional)</Label>
        <Input
          value={data.outputVariable ?? ""}
          onChange={(e) => update({ outputVariable: e.target.value })}
          placeholder="If empty, response is sent as a message"
        />
      </div>
    </>
  );
}

function KbSearchEditor({ data, update }: { data: KbSearchNodeData; update: (p: Record<string, unknown>) => void }) {
  return (
    <>
      <div>
        <Label>Query</Label>
        <Textarea
          rows={3}
          value={data.query ?? ""}
          onChange={(e) => update({ query: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Top K</Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={data.topK ?? 4}
            onChange={(e) => update({ topK: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>Output variable</Label>
          <Input
            value={data.outputVariable ?? ""}
            onChange={(e) => update({ outputVariable: e.target.value })}
          />
        </div>
      </div>
    </>
  );
}

function ApiCallEditor({ data, update }: { data: ApiCallNodeData; update: (p: Record<string, unknown>) => void }) {
  return (
    <>
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-3">
          <Label>Method</Label>
          <Select value={data.method} onValueChange={(v) => update({ method: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-9">
          <Label>URL</Label>
          <Input
            value={data.url ?? ""}
            onChange={(e) => update({ url: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label>Headers (one key=value per line)</Label>
        <Textarea
          rows={3}
          value={Object.entries(data.headers ?? {})
            .map(([k, v]) => `${k}=${v}`)
            .join("\n")}
          onChange={(e) => {
            const headers: Record<string, string> = {};
            e.target.value.split(/\n+/).forEach((line) => {
              const idx = line.indexOf("=");
              if (idx > -1) headers[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
            });
            update({ headers });
          }}
        />
      </div>
      <div>
        <Label>Body</Label>
        <Textarea
          rows={4}
          value={data.body ?? ""}
          onChange={(e) => update({ body: e.target.value })}
        />
      </div>
      <div>
        <Label>Output variable</Label>
        <Input
          value={data.outputVariable ?? ""}
          onChange={(e) => update({ outputVariable: e.target.value })}
        />
      </div>
    </>
  );
}

function SubflowEditor({ data, update }: { data: SubflowNodeData; update: (p: Record<string, unknown>) => void }) {
  return (
    <div>
      <Label>Flow ID</Label>
      <Input
        value={data.flowId ?? ""}
        onChange={(e) => update({ flowId: e.target.value })}
        placeholder="flw_..."
      />
      <p className="mt-1 text-xs text-muted-foreground">
        Reference another flow id from the same project. Inline execution via parent runtime.
      </p>
    </div>
  );
}
