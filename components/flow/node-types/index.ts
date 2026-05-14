"use client";

import { StartNode } from "./start-node";
import { MessageNode } from "./message-node";
import { CaptureNode } from "./capture-node";
import { ChoiceNode } from "./choice-node";
import { ConditionNode } from "./condition-node";
import { SetVariableNode } from "./set-variable-node";
import { LlmNode } from "./llm-node";
import { KbSearchNode } from "./kb-search-node";
import { ApiCallNode } from "./api-call-node";
import { SubflowNode } from "./subflow-node";
import { CommentNode } from "./comment-node";
import { OperatorNode } from "./operator-node";
import { ExprFunctionNode } from "./expr-function-node";
import { CardsNode } from "./cards-node";
import { EndNode } from "./end-node";

export const nodeTypes = {
  start: StartNode,
  message: MessageNode,
  capture: CaptureNode,
  choice: ChoiceNode,
  condition: ConditionNode,
  set_variable: SetVariableNode,
  operator: OperatorNode,
  function: ExprFunctionNode,
  cards: CardsNode,
  llm: LlmNode,
  kb_search: KbSearchNode,
  api_call: ApiCallNode,
  subflow: SubflowNode,
  comment: CommentNode,
  end: EndNode,
};
