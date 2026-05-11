export type TraceLevel = "info" | "debug" | "warn" | "error";

export interface TraceEvent {
  id: string;
  conversationId: string;
  nodeId: string | null;
  nodeKind: string | null;
  level: TraceLevel;
  message: string;
  payload?: unknown;
  createdAt: number;
}

export interface SimulatorMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
  nodeId?: string;
}

export type SimulatorEvent =
  | { kind: "message"; message: SimulatorMessage }
  | { kind: "node_enter"; nodeId: string; nodeKind: string }
  | { kind: "node_exit"; nodeId: string; nodeKind: string }
  | { kind: "variable_set"; variable: string; value: unknown }
  | { kind: "trace"; trace: TraceEvent }
  | {
      kind: "request_input";
      /** Capture / choice node id — lets the simulator know we are awaiting input before the final `done` event. */
      nodeId?: string;
      prompt: string;
      suggestedReplies?: string[];
      choices?: { id: string; label: string }[];
    }
  | { kind: "end"; reason?: string }
  | { kind: "error"; error: string };
