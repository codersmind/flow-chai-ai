"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useSimulatorStore } from "@/stores/simulator-store";

export function VariableInspector() {
  const variables = useSimulatorStore((s) => s.variables);
  const entries = Object.entries(variables);
  return (
    <ScrollArea className="h-full">
      <div className="p-3">
        {entries.length === 0 ? (
          <p className="text-xs text-muted-foreground">No variables yet.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-1 font-semibold">Variable</th>
                <th className="pb-1 font-semibold">Value</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([k, v]) => (
                <tr key={k} className="border-t">
                  <td className="py-1 pr-2 font-mono">{k}</td>
                  <td className="py-1 break-all font-mono text-muted-foreground">
                    {typeof v === "string" ? v : JSON.stringify(v)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ScrollArea>
  );
}
