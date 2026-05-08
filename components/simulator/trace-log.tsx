"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useSimulatorStore } from "@/stores/simulator-store";
import { cn } from "@/lib/utils";
import type { TraceEvent } from "@/types/trace";

const LEVEL_COLORS: Record<string, string> = {
  info: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-100",
  debug: "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
  warn: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  error: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-100",
};

export function TraceLog() {
  const traces = useSimulatorStore((s) => s.traces);
  const safeTraces = (traces as Array<Partial<TraceEvent> | null | undefined>).filter(
    (t): t is TraceEvent =>
      !!t &&
      typeof t.id === "string" &&
      typeof t.conversationId === "string" &&
      typeof t.level === "string" &&
      typeof t.createdAt === "number" &&
      typeof t.message === "string"
  );
  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-3">
        {safeTraces.length === 0 ? (
          <p className="text-xs text-muted-foreground">Run the simulator to see traces here.</p>
        ) : null}
        {safeTraces.map((t) => (
          <div key={t.id} className="rounded border bg-background p-2 text-xs">
            <div className="mb-1 flex items-center justify-between">
              <Badge
                variant="outline"
                className={cn(LEVEL_COLORS[t.level] ?? LEVEL_COLORS.info)}
              >
                {t.level}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {new Date(t.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-xs">{t.message}</p>
            {t.nodeId ? (
              <p className="text-[10px] text-muted-foreground">
                node: {t.nodeId} ({t.nodeKind})
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
