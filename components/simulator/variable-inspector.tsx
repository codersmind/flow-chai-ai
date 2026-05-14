"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useSimulatorStore } from "@/stores/simulator-store";
import type { AgentVariable } from "@/types/project";
import { Badge } from "@/components/ui/badge";

function formatValue(v: unknown): string {
  if (typeof v === "string") return v;
  if (v === undefined || v === null) return "";
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

interface VariableInspectorProps {
  definitions?: AgentVariable[];
}

export function VariableInspector({ definitions = [] }: VariableInspectorProps) {
  const variables = useSimulatorStore((s) => s.variables);
  const defNames = new Set(definitions.map((d) => d.name));
  const extraEntries = Object.entries(variables).filter(([k]) => !defNames.has(k));

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-3">
        <p className="text-[11px] leading-snug text-muted-foreground">
          Built-ins on each user message: <span className="font-mono">user_message</span>,{" "}
          <span className="font-mono">last_user_message</span>,{" "}
          <span className="font-mono">last_utterance</span> (Voiceflow-style raw line). After a Capture into
          another variable, <span className="font-mono">last_utterance</span> stays raw for{" "}
          <span className="font-mono">{"{{last_utterance}}"}</span> in Set Variable.
        </p>
        {definitions.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Agent variables
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pb-1.5 font-semibold">Name</th>
                  <th className="pb-1.5 font-semibold">Runtime</th>
                  <th className="pb-1.5 font-semibold">Default</th>
                </tr>
              </thead>
              <tbody>
                {definitions.map((def) => {
                  const hasKey = Object.prototype.hasOwnProperty.call(variables, def.name);
                  const raw = hasKey ? variables[def.name] : undefined;
                  const hasRuntime =
                    hasKey && raw !== undefined && !(typeof raw === "string" && raw === "");
                  return (
                    <tr key={def.id} className="border-t border-border/60">
                      <td className="py-1.5 pr-2 align-top">
                        <span className="font-mono font-medium">{def.name}</span>
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            {def.type}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] font-normal">
                            {def.scope}
                          </Badge>
                        </div>
                      </td>
                      <td className="max-w-[40%] break-all py-1.5 font-mono text-muted-foreground">
                        {hasRuntime ? (
                          formatValue(raw)
                        ) : (
                          <span className="italic opacity-70">not set</span>
                        )}
                      </td>
                      <td className="break-all py-1.5 font-mono text-muted-foreground/80">
                        {def.defaultValue ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No agent variables defined. Open{" "}
            <span className="font-medium text-foreground">Variables</span> in the builder header or
            the project page to add them.
          </p>
        )}

        {extraEntries.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Flow runtime
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pb-1 font-semibold">Variable</th>
                  <th className="pb-1 font-semibold">Value</th>
                </tr>
              </thead>
              <tbody>
                {extraEntries.map(([k, v]) => (
                  <tr key={k} className="border-t">
                    <td className="py-1 pr-2 font-mono">{k}</td>
                    <td className="py-1 break-all font-mono text-muted-foreground">
                      {formatValue(v)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : definitions.length === 0 && Object.keys(variables).length === 0 ? (
          <p className="text-xs text-muted-foreground">Run the simulator to populate runtime state.</p>
        ) : null}
      </div>
    </ScrollArea>
  );
}
