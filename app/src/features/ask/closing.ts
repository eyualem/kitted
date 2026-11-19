// The model's closing block (07 §5.2): after the answer it writes one fenced JSON block (```json … ```) naming at
// most one card, one remember and one lookup it needs, and whether it declined. The block never shows: the
// splitter holds back anything that could be its start while the answer streams, then parses it at the end. A
// block that doesn't parse, or has unknown parts, is dropped (the answer stays, 07 §5.2 "drops the card, never the
// answer"). A bare JSON last line (the model forgot the fence) is treated the same way.

export interface ClosingBlock {
  card: unknown;
  remember: unknown;
  need: unknown;
  refused: boolean;
  /** "Can I wear…": the model's own yes / no / depends (J5), checked against the rules' verdict. */
  verdict: 'yes' | 'no' | 'depends' | null;
  /** The follow-up taps as the model wrote them (raw, null when absent): cards.ts `checkFollowUps` decides which stay. */
  followUps: unknown;
}

export const EMPTY_BLOCK: ClosingBlock = { card: null, remember: null, need: null, refused: false, verdict: null, followUps: null };

/** The JSON of a block, or null when it isn't one (not JSON, not an object, none of the four keys). */
export function parseClosing(raw: string): ClosingBlock | null {
  const body = raw.replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/, '').trim();
  if (!body.startsWith('{')) return null;
  let v: unknown;
  try {
    v = JSON.parse(body);
  } catch {
    return null;
  }
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  if (!['card', 'remember', 'need', 'refused', 'followUps'].some((k) => k in o)) return null;
  const verdict = o.verdict === 'yes' || o.verdict === 'no' || o.verdict === 'depends' ? o.verdict : null;
  return { card: o.card ?? null, remember: o.remember ?? null, need: o.need ?? null, refused: o.refused === true, verdict, followUps: o.followUps ?? null };
}

/**
 * Splits a stream into the answer and its closing block. `push` returns the text that may show now; `end` returns
 * the rest of the answer and the parsed block (EMPTY_BLOCK when there was none or it didn't parse).
 */
export function createClosingSplitter() {
  let held = '';
  let inBlock = false;
  let block = '';
  return {
    push(text: string): string {
      if (inBlock) {
        block += text;
        return '';
      }
      held += text;
      const fence = held.indexOf('```');
      if (fence >= 0) {
        inBlock = true;
        block = held.slice(fence);
        const out = held.slice(0, fence);
        held = '';
        return out;
      }
      // Hold back what could still become the fence (a trailing ` or ``) or a bare JSON last line ("\n{" onwards).
      let keep = held.length;
      const tick = /`{1,2}$/.exec(held);
      if (tick) keep = tick.index;
      const brace = held.lastIndexOf('\n{');
      if (brace >= 0 && brace < keep) keep = brace;
      if (held.startsWith('{') && keep > 0) keep = 0;
      const out = held.slice(0, keep);
      held = held.slice(keep);
      return out;
    },
    end(): { rest: string; block: ClosingBlock } {
      if (inBlock) return { rest: '', block: parseClosing(block) ?? EMPTY_BLOCK };
      const bare = parseClosing(held);
      if (bare) return { rest: '', block: bare };
      const rest = held;
      held = '';
      return { rest, block: EMPTY_BLOCK };
    },
  };
}
