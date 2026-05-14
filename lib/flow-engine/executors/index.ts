import "server-only";
import { registerExecutor } from "../registry";
import { startExecutor } from "./start";
import { messageExecutor } from "./message";
import { captureExecutor } from "./capture";
import { choiceExecutor } from "./choice";
import { conditionExecutor } from "./condition";
import { setVariableExecutor } from "./set-variable";
import { operatorExecutor } from "./operator";
import { exprFunctionExecutor } from "./expr-function";
import { cardsExecutor } from "./cards";
import { llmExecutor } from "./llm";
import { kbSearchExecutor } from "./kb-search";
import { apiCallExecutor } from "./api-call";
import { subflowExecutor } from "./subflow";
import { commentExecutor } from "./comment";
import { endExecutor } from "./end";

let registered = false;
export function ensureExecutorsRegistered() {
  if (registered) return;
  registerExecutor("start", startExecutor);
  registerExecutor("message", messageExecutor);
  registerExecutor("capture", captureExecutor);
  registerExecutor("choice", choiceExecutor);
  registerExecutor("condition", conditionExecutor);
  registerExecutor("set_variable", setVariableExecutor);
  registerExecutor("operator", operatorExecutor);
  registerExecutor("function", exprFunctionExecutor);
  registerExecutor("cards", cardsExecutor);
  registerExecutor("llm", llmExecutor);
  registerExecutor("kb_search", kbSearchExecutor);
  registerExecutor("api_call", apiCallExecutor);
  registerExecutor("subflow", subflowExecutor);
  registerExecutor("comment", commentExecutor);
  registerExecutor("end", endExecutor);
  registered = true;
}
