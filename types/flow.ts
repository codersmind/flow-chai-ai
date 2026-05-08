export type NodeKind =
  | "start"
  | "message"
  | "capture"
  | "choice"
  | "condition"
  | "set_variable"
  | "llm"
  | "kb_search"
  | "api_call"
  | "subflow"
  | "comment"
  | "end";

export interface FlowNodeBase<TKind extends NodeKind, TData> {
  id: string;
  type: TKind;
  position: { x: number; y: number };
  data: TData;
}

export interface StartNodeData {
  label: string;
}

export interface MessageNodeData {
  label: string;
  message: string;
}

export interface CaptureNodeData {
  label: string;
  prompt: string;
  variable: string;
  suggestedReplies?: string[];
}

export interface ChoiceOption {
  id: string;
  label: string;
}

export interface ChoiceNodeData {
  label: string;
  prompt: string;
  options: ChoiceOption[];
}

export interface ConditionRule {
  id: string;
  variable: string;
  operator: "equals" | "not_equals" | "contains" | "gt" | "lt" | "is_empty";
  value: string;
}

export interface ConditionNodeData {
  label: string;
  mode: "rules" | "llm_router";
  rules: ConditionRule[];
  llmPrompt?: string;
  routes: { id: string; label: string }[];
}

export interface SetVariableAssignment {
  id: string;
  variable: string;
  value: string;
}

export interface SetVariableNodeData {
  label: string;
  assignments: SetVariableAssignment[];
}

export interface LlmNodeData {
  label: string;
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  jsonMode?: boolean;
  outputVariable?: string;
}

export interface KbSearchNodeData {
  label: string;
  query: string;
  topK: number;
  outputVariable: string;
}

export interface ApiCallNodeData {
  label: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
  headers: Record<string, string>;
  body?: string;
  outputVariable: string;
}

export interface SubflowNodeData {
  label: string;
  flowId: string;
}

export interface CommentNodeData {
  label: string;
  text: string;
}

export interface EndNodeData {
  label: string;
}

export type FlowNode =
  | FlowNodeBase<"start", StartNodeData>
  | FlowNodeBase<"message", MessageNodeData>
  | FlowNodeBase<"capture", CaptureNodeData>
  | FlowNodeBase<"choice", ChoiceNodeData>
  | FlowNodeBase<"condition", ConditionNodeData>
  | FlowNodeBase<"set_variable", SetVariableNodeData>
  | FlowNodeBase<"llm", LlmNodeData>
  | FlowNodeBase<"kb_search", KbSearchNodeData>
  | FlowNodeBase<"api_call", ApiCallNodeData>
  | FlowNodeBase<"subflow", SubflowNodeData>
  | FlowNodeBase<"comment", CommentNodeData>
  | FlowNodeBase<"end", EndNodeData>;

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
}

export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface FlowExportPayload {
  version: 1;
  exportedAt: string;
  project: {
    id: string;
    name: string;
    description?: string;
    defaultModel?: string;
    globalInstructions?: string;
    personality?: string;
    guardrails?: string;
  };
  flows: {
    id: string;
    name: string;
    graph: FlowGraph;
  }[];
}
