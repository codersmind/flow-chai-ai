"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function ExportProjectButton({ projectId }: { projectId: string }) {
  return (
    <Button asChild variant="outline">
      <a href={`/api/import-export?projectId=${projectId}`} download>
        <Download className="mr-2 h-4 w-4" />
        Export
      </a>
    </Button>
  );
}
