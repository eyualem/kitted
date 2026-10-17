// What a Gemini or OpenAI call costs (handoff/13-server.md §4, check M1; OpenAI §11, O5). Prices per million tokens, paid tier, from
// market/ai-costs.md §1 (read Oct 15, 2026). Keep the two in step.

export interface Price {
  /** $ per million prompt tokens (not cached). */
  input: number;
  /** $ per million output tokens; thinking tokens are billed the same. */
  output: number;
  /** $ per million cached prompt tokens. */
  cached: number;
}

/** 3.8 Flash doubles on Jan 1, 2027. */
const DOUBLING_AT = Date.UTC(2027, 0, 1);

export function priceFor(model: string, nowMs: number): Price {
  if (model.startsWith('gpt-5.6-luna')) return { input: 0.2, output: 1.2, cached: 0.02 };
  if (model.startsWith('gemini-3.5-flash-lite')) return { input: 0.3, output: 2.5, cached: 0.03 };
  if (model.startsWith('gemini-3.1-flash-lite')) return { input: 0.25, output: 1.5, cached: 0.025 };
  // gemini-3.8-flash, and anything unknown priced as the dearest one on our lists.
  return nowMs >= DOUBLING_AT ? { input: 1.5, output: 7.5, cached: 0.15 } : { input: 0.75, output: 3.75, cached: 0.075 };
}

export interface Usage {
  promptTokenCount?: number;
  cachedContentTokenCount?: number;
  candidatesTokenCount?: number;
  thoughtsTokenCount?: number;
}

/** Cents for one call, from its usageMetadata. */
export function costCents(model: string, usage: Usage | undefined, nowMs: number): number {
  if (!usage) return 0;
  const p = priceFor(model, nowMs);
  const cached = usage.cachedContentTokenCount ?? 0;
  const prompt = Math.max(0, (usage.promptTokenCount ?? 0) - cached);
  const out = (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0);
  const dollars = (prompt * p.input + cached * p.cached + out * p.output) / 1e6;
  return dollars * 100;
}
