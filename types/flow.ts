import type { AgentVariable } from "./project";

export type NodeKind =
  | "start"
  | "message"
  | "capture"
  | "choice"
  | "condition"
  | "set_variable"
  | "operator"
  | "function"
  | "cards"
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

/** How the capture node stores the user reply into the variable (on resume). */
export type CaptureNameCleanup = "none" | "ai";

export interface CaptureNodeData {
  label: string;
  prompt: string;
  variable: string;
  suggestedReplies?: string[];
  /**
   * none = full reply; ai = ask the configured chat model to extract the answer using the capture prompt and variable name as context (names, addresses, etc.).
   */
  nameCleanup?: CaptureNameCleanup;
  /** @deprecated use `nameCleanup: "ai"` */
  extractDisplayName?: boolean;
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

/** How a Set Variable assignment stores the resolved value (string results only). */
export type SetVariableValueCleanup = "none" | "ai";

export interface SetVariableAssignment {
  id: string;
  variable: string;
  value: string;
  /**
   * none = use interpolated value as-is.
   * ai = if the resolved value is a string, run the same smart extract as Capture (uses Settings → Chat provider).
   */
  valueCleanup?: SetVariableValueCleanup;
}

export interface SetVariableNodeData {
  label: string;
  assignments: SetVariableAssignment[];
}

export type OperatorStepOp =
  | "set"
  | "append"
  | "add"
  | "subtract"
  | "multiply"
  | "divide"
  | "uppercase"
  | "lowercase"
  | "trim"
  | "replace";

export interface OperatorStep {
  id: string;
  targetVariable: string;
  op: OperatorStepOp;
  /** Operand templates ({{var}}); meaning depends on op — see inspector help */
  args: string[];
}

export interface OperatorNodeData {
  label: string;
  steps: OperatorStep[];
}

/** Voiceflow-style Function: JEXL expression evaluated against flow variables. */
export interface ExprFunctionNodeData {
  label: string;
  expression: string;
  outputVariable: string;
}

export interface CardSlide {
  id: string;
  title: string;
  body?: string;
  imageUrl?: string;
}

export interface CardsNodeData {
  label: string;
  /** Shown above the cards (supports {{vars}}) */
  intro?: string;
  layout: "stack" | "carousel";
  cards: CardSlide[];
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
  | FlowNodeBase<"operator", OperatorNodeData>
  | FlowNodeBase<"function", ExprFunctionNodeData>
  | FlowNodeBase<"cards", CardsNodeData>
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
  /** React Flow built-in: `default`, `straight`, `step`, `smoothstep`, … */
  type?: string;
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
    agentVariables?: AgentVariable[];
  };
  flows: {
    id: string;
    name: string;
    graph: FlowGraph;
  }[];
}
