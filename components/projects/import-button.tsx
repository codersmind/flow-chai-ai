"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";

export function ImportProjectButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onFile = async (file: File) => {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch("/api/import-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Import failed (${res.status})`);
      }
      const { project } = (await res.json()) as { project: { id: string } };
      toast.success("Project imported");
      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Import failed";
      toast.error(message);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onFile(file);
          e.target.value = "";
        }}
      />
      <Button variant="outline" onClick={() => inputRef.current?.click()}>
        <Upload className="mr-2 h-4 w-4" />
        Import
      </Button>
    </>
  );
}
