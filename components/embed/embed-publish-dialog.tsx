"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Code2 } from "lucide-react";
import { toast } from "sonner";

interface EmbedPublishDialogProps {
  flowId: string;
  initialEnabled: boolean;
  initialToken: string | null;
}

export function EmbedPublishDialog({
  flowId,
  initialEnabled,
  initialToken,
}: EmbedPublishDialogProps) {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [token, setToken] = useState(initialToken);

  useEffect(() => {
    setEnabled(initialEnabled);
    setToken(initialToken);
  }, [initialEnabled, initialToken]);

  const syncFromServer = (flow: {
    embedEnabled?: boolean;
    embedToken?: string | null;
  }) => {
    if (typeof flow.embedEnabled === "boolean") setEnabled(flow.embedEnabled);
    if ("embedToken" in flow) setToken(flow.embedToken ?? null);
  };

  const patchEmbed = async (body: { enabled?: boolean; regenerate?: boolean }) => {
    const res = await fetch(`/api/flows/${flowId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embed: body }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || `Request failed (${res.status})`);
    }
    const data = (await res.json()) as { flow?: { embedEnabled: boolean; embedToken: string | null } };
    if (data.flow) syncFromServer(data.flow);
  };

  const onToggle = async (checked: boolean) => {
    try {
      await patchEmbed({ enabled: checked });
      toast.success(checked ? "Embed enabled" : "Embed disabled");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const onRegenerate = async () => {
    try {
      await patchEmbed({ regenerate: true });
      toast.success("New embed token generated — update your site snippet.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Regenerate failed");
    }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const snippet =
    enabled && token
      ? `<script src="${origin}/api/embed/widget?flowId=${encodeURIComponent(flowId)}&token=${encodeURIComponent(token)}" defer></script>`
      : "";

  const copySnippet = async () => {
    if (!snippet) {
      toast.info("Enable embed first.");
      return;
    }
    try {
      await navigator.clipboard.writeText(snippet);
      toast.success("Snippet copied to clipboard");
    } catch {
      toast.error("Could not copy — copy manually from the box.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-xl" title="Website embed">
          <Code2 className="mr-1 h-3.5 w-3.5" />
          Embed
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(85vh,640px)] max-w-[calc(100vw-1.5rem)] gap-0 overflow-y-auto border-border/60 p-0 shadow-2xl sm:max-w-lg sm:rounded-2xl">
        <DialogHeader className="space-y-2 border-b border-border/60 bg-muted/20 px-6 pb-4 pt-6 pr-14 text-left">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Publish to website
          </DialogTitle>
          <DialogDescription className="max-w-full text-left text-sm leading-relaxed text-muted-foreground break-words">
            Add the script to your HTML. A chat button appears in the corner; visitors open your
            flow in a floating panel.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 px-6 py-5">
          <div className="flex items-start justify-between gap-4 rounded-xl bg-muted/40 px-4 py-3.5">
            <div className="min-w-0 flex-1 space-y-1">
              <Label htmlFor="embed-enabled" className="text-sm font-medium leading-snug">
                Enable embed
              </Label>
              <p className="text-xs leading-snug text-muted-foreground">
                Anyone with the snippet can run this flow.
              </p>
            </div>
            <Switch
              id="embed-enabled"
              className="mt-0.5 shrink-0"
              checked={enabled}
              onCheckedChange={(v) => onToggle(v)}
            />
          </div>
          {enabled && token ? (
            <>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Install snippet</Label>
                <pre
                  tabIndex={0}
                  className="cursor-text select-all whitespace-pre-wrap break-words rounded-xl border border-slate-300/50 bg-slate-200/70 p-3.5 font-mono text-[11px] leading-relaxed text-slate-800 shadow-inner outline-none dark:border-slate-600/50 dark:bg-slate-900/70 dark:text-slate-100"
                >
                  {snippet}
                </pre>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" className="rounded-xl" onClick={copySnippet}>
                  Copy snippet
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={onRegenerate}
                >
                  Regenerate token
                </Button>
              </div>
            </>
          ) : enabled ? (
            <p className="text-xs text-muted-foreground">Saving token… reopen if this persists.</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
