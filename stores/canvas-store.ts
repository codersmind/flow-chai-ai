"use client";

import { create } from "zustand";
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from "@xyflow/react";
import { nanoid } from "nanoid";
import type { NodeKind } from "@/types/flow";

interface HistorySnapshot {
  nodes: Node[];
  edges: Edge[];
}

interface CanvasState {
  flowId: string | null;
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  activeNodeId: string | null;
  dirty: boolean;
  history: HistorySnapshot[];
  future: HistorySnapshot[];
  initialize: (flowId: string, nodes: Node[], edges: Edge[]) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (kind: NodeKind, position: { x: number; y: number }) => void;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  setSelectedNode: (id: string | null) => void;
  setActiveNode: (id: string | null) => void;
  removeNode: (id: string) => void;
  clearDirty: () => void;
  undo: () => void;
  redo: () => void;
  takeSnapshot: () => void;
}

const HISTORY_LIMIT = 50;

function defaultDataFor(kind: NodeKind): Record<string, unknown> {
  switch (kind) {
    case "start":
      return { label: "Start" };
    case "message":
      return { label: "Message", message: "Hello!" };
    case "capture":
      return { label: "Capture", prompt: "What's your name?", variable: "name", suggestedReplies: [] };
    case "choice":
      return {
        label: "Choice",
        prompt: "Pick an option:",
        options: [
          { id: "opt_a", label: "Option A" },
          { id: "opt_b", label: "Option B" },
        ],
      };
    case "condition":
      return {
        label: "Condition",
        mode: "rules",
        rules: [{ id: "r1", variable: "name", operator: "is_empty", value: "" }],
        routes: [
          { id: "r1", label: "If true" },
          { id: "else", label: "Else" },
        ],
      };
    case "set_variable":
      return {
        label: "Set Variable",
        assignments: [{ id: "a1", variable: "key", value: "value" }],
      };
    case "llm":
      return {
        label: "LLM",
        systemPrompt: "You are a helpful assistant.",
        userPrompt: "{{user_message}}",
        temperature: 0.7,
        outputVariable: "",
      };
    case "kb_search":
      return { label: "KB Search", query: "{{user_message}}", topK: 4, outputVariable: "kb_context" };
    case "api_call":
      return {
        label: "API Call",
        method: "GET",
        url: "https://example.com/api",
        headers: {},
        body: "",
        outputVariable: "api_result",
      };
    case "subflow":
      return { label: "Subflow", flowId: "" };
    case "comment":
      return { label: "Comment", text: "Your note..." };
    case "end":
      return { label: "End" };
    default:
      return { label: kind };
  }
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  flowId: null,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  activeNodeId: null,
  dirty: false,
  history: [],
  future: [],

  initialize: (flowId, nodes, edges) =>
    set({
      flowId,
      nodes,
      edges,
      selectedNodeId: null,
      activeNodeId: null,
      dirty: false,
      history: [],
      future: [],
    }),

  setNodes: (nodes) => set({ nodes, dirty: true }),
  setEdges: (edges) => set({ edges, dirty: true }),

  onNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
      dirty: true,
    })),

  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
      dirty: true,
    })),

  onConnect: (connection) =>
    set((state) => ({
      edges: addEdge(
        { ...connection, id: `e_${nanoid(8)}` },
        state.edges
      ),
      dirty: true,
    })),

  addNode: (kind, position) => {
    get().takeSnapshot();
    const id = `${kind}_${nanoid(6)}`;
    const newNode: Node = {
      id,
      type: kind,
      position,
      data: defaultDataFor(kind),
    };
    set((state) => ({
      nodes: [...state.nodes, newNode],
      dirty: true,
      selectedNodeId: id,
    }));
  },

  updateNodeData: (nodeId, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
      dirty: true,
    })),

  setSelectedNode: (id) => set({ selectedNodeId: id }),
  setActiveNode: (id) => set({ activeNodeId: id }),

  removeNode: (id) => {
    get().takeSnapshot();
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
      dirty: true,
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    }));
  },

  clearDirty: () => set({ dirty: false }),

  takeSnapshot: () => {
    const { nodes, edges, history } = get();
    const snapshot: HistorySnapshot = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };
    const next = [...history, snapshot];
    if (next.length > HISTORY_LIMIT) next.shift();
    set({ history: next, future: [] });
  },

  undo: () => {
    const { history, nodes, edges, future } = get();
    if (!history.length) return;
    const prev = history[history.length - 1];
    const snapshot: HistorySnapshot = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };
    set({
      nodes: prev.nodes,
      edges: prev.edges,
      history: history.slice(0, -1),
      future: [...future, snapshot],
      dirty: true,
    });
  },

  redo: () => {
    const { future, nodes, edges, history } = get();
    if (!future.length) return;
    const next = future[future.length - 1];
    const snapshot: HistorySnapshot = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };
    set({
      nodes: next.nodes,
      edges: next.edges,
      future: future.slice(0, -1),
      history: [...history, snapshot],
      dirty: true,
    });
  },
}));
