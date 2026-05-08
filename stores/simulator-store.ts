"use client";

import { create } from "zustand";
import type { SimulatorEvent, SimulatorMessage, TraceEvent } from "@/types/trace";

interface SimulatorState {
  conversationId: string | null;
  awaitingNodeId: string | null;
  messages: SimulatorMessage[];
  variables: Record<string, unknown>;
  traces: TraceEvent[];
  pendingChoices: { id: string; label: string }[] | null;
  pendingSuggestions: string[];
  running: boolean;
  ended: boolean;
  initialize: () => void;
  appendEvent: (event: SimulatorEvent) => void;
  setRunning: (running: boolean) => void;
  reset: () => void;
}

export const useSimulatorStore = create<SimulatorState>((set) => ({
  conversationId: null,
  awaitingNodeId: null,
  messages: [],
  variables: {},
  traces: [],
  pendingChoices: null,
  pendingSuggestions: [],
  running: false,
  ended: false,

  initialize: () =>
    set({
      conversationId: null,
      awaitingNodeId: null,
      messages: [],
      variables: {},
      traces: [],
      pendingChoices: null,
      pendingSuggestions: [],
      running: false,
      ended: false,
    }),

  appendEvent: (event) =>
    set((state) => {
      switch (event.kind) {
        case "message":
          return { messages: [...state.messages, event.message] };
        case "node_enter":
          return {};
        case "node_exit":
          return {};
        case "variable_set":
          return { variables: { ...state.variables, [event.variable]: event.value } };
        case "trace":
          return { traces: [event.trace, ...state.traces].slice(0, 200) };
        case "request_input":
          return {
            pendingChoices: event.choices ?? null,
            pendingSuggestions: event.suggestedReplies ?? [],
          };
        case "end":
          return { ended: true, running: false };
        case "error":
          return {
            ended: true,
            running: false,
            traces: [
              {
                id: `trc_${Date.now()}`,
                conversationId: state.conversationId ?? "local",
                nodeId: null,
                nodeKind: null,
                level: "error",
                message: event.error,
                createdAt: Date.now(),
              },
              ...state.traces,
            ],
          };
        default:
          return {};
      }
    }),

  setRunning: (running) => set({ running }),
  reset: () =>
    set({
      messages: [],
      variables: {},
      traces: [],
      awaitingNodeId: null,
      pendingChoices: null,
      pendingSuggestions: [],
      running: false,
      ended: false,
      conversationId: null,
    }),
}));
