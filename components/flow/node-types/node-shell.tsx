"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useCanvasStore } from "@/stores/canvas-store";

interface NodeShellProps {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  accent?: string;
  children?: React.ReactNode;
  className?: string;
}

export function NodeShell({ id, title, subtitle, icon, accent, children, className }: NodeShellProps) {
  const activeNodeId = useCanvasStore((s) => s.activeNodeId);
  const isActive = activeNodeId === id;
  return (
    <div
      className={cn(
        "min-w-[240px] max-w-[320px] rounded-lg border bg-card text-card-foreground shadow-sm",
        isActive && "lvf-node-active",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 rounded-t-lg border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide",
          accent ?? "bg-muted/60 text-foreground"
        )}
      >
        {icon}
        <span>{title}</span>
      </div>
      {subtitle ? (
        <div className="px-3 pt-2 text-xs text-muted-foreground">{subtitle}</div>
      ) : null}
      <div className="px-3 py-2 text-sm">{children}</div>
    </div>
  );
}
