"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChatPanel } from "./chat-panel";
import { VariableInspector } from "./variable-inspector";
import { TraceLog } from "./trace-log";

interface SimulatorPanelProps {
  flowId: string;
}

export function SimulatorPanel({ flowId }: SimulatorPanelProps) {
  return (
    <Tabs defaultValue="chat" className="flex h-full flex-col">
      <TabsList className="m-3 h-11 rounded-xl bg-muted/70 p-1">
        <TabsTrigger value="chat">Simulator</TabsTrigger>
        <TabsTrigger value="variables">Variables</TabsTrigger>
        <TabsTrigger value="traces">Traces</TabsTrigger>
      </TabsList>
      <TabsContent value="chat" className="m-0 flex-1 overflow-hidden">
        <ChatPanel flowId={flowId} />
      </TabsContent>
      <TabsContent value="variables" className="m-0 flex-1 overflow-hidden">
        <VariableInspector />
      </TabsContent>
      <TabsContent value="traces" className="m-0 flex-1 overflow-hidden">
        <TraceLog />
      </TabsContent>
    </Tabs>
  );
}
