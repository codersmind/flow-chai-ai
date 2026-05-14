declare module "jexl" {
  interface JexlInstance {
    eval(expression: string, context?: Record<string, unknown>): unknown;
  }
  const jexl: JexlInstance;
  export default jexl;
}
