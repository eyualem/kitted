// T65 (stub): the plain name of every rule the parts engine can charge or credit (tasks/T65/TESTING.md ER1.6).
// The implementer fills RULE_NAMES (insertion order = tie-break order) and ruleName.
export interface RuleName { plain: string; known?: string }
export const RULE_NAMES: Readonly<Record<string, RuleName>> = {};
export const RULE_IDS: readonly string[] = [];
export function ruleName(_id: string): RuleName {
  throw new Error("T65: not built");
}
