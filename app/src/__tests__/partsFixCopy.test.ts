// The parts fix engine's copy (#208) lives in core's catalog (handoff/fixtures/fixes.json -> "parts") and, for the
// founder to skim, in en.ts (`pfix.*`). This keeps the two word for word, so a change to one can't drift from the other.
import { PARTS_FIXES_DATA } from '@kitted/core';
import { en } from '@/i18n/en';

const deck = en as Record<string, string | undefined>;

describe('parts fix copy (pfix.*)', () => {
  it('every catalog line is in en.ts, word for word', () => {
    const problems: string[] = [];
    const want = (k: string, v: string) => {
      if (deck[k] !== v) problems.push(`${k}: en.ts ${JSON.stringify(deck[k])} vs catalog ${JSON.stringify(v)}`);
    };
    for (const [k, v] of Object.entries(PARTS_FIXES_DATA.classes)) want(`pfix.tag.${k}`, v.tag);
    for (const [k, v] of Object.entries(PARTS_FIXES_DATA.copy)) want(`pfix.copy.${k}`, v);
    for (const c of PARTS_FIXES_DATA.candidates) {
      want(`pfix.${c.id}`, c.copy);
      if (c.detail) want(`pfix.${c.id}.detail`, c.detail);
      want(`pfix.${c.id}.step`, c.step);
    }
    for (const n of PARTS_FIXES_DATA.nextLevel) want(`pfix.${n.id}`, n.copy);
    expect(problems).toEqual([]);
  });

  it('en.ts has no pfix line the catalog dropped', () => {
    const known = new Set<string>([
      ...Object.keys(PARTS_FIXES_DATA.classes).map((k) => `pfix.tag.${k}`),
      ...Object.keys(PARTS_FIXES_DATA.copy).map((k) => `pfix.copy.${k}`),
      ...PARTS_FIXES_DATA.candidates.flatMap((c) => [`pfix.${c.id}`, `pfix.${c.id}.detail`, `pfix.${c.id}.step`]),
      ...PARTS_FIXES_DATA.nextLevel.map((n) => `pfix.${n.id}`),
    ]);
    expect(Object.keys(en).filter((k) => k.startsWith('pfix.') && !known.has(k))).toEqual([]);
  });

  // "straight-leg" is the pant's leg (a garment word), so a hyphenated leg is allowed
  it('names garments, never the body', () => {
    const BODY = /\b(body|bodies|belly|stomach|waistline|hips?|(?<!-)legs?|thighs?|arms?|shoulders?|chest|weight|slimming|flattering|skinny you|short you|tall)\b/i;
    const lines = Object.entries(en).filter(([k]) => k.startsWith('pfix.')).filter(([, v]) => BODY.test(v));
    expect(lines).toEqual([]);
  });
});
