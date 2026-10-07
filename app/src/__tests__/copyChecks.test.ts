// Automated copy checks (P2): over every string in the app and over what the cards actually say
// for every demo reading × occasion × closet × first check. Rules from CLAUDE.md "Wording":
// never "AI stylist", never "unlimited", no emoji or ✓ ▾ ↑ glyphs (SF Symbols draw those),
// no unfilled {placeholder}, and no score above 9.5.
import type { ClosetItem, Reading, Styles } from '@kitted/core';
import expected from '../../../handoff/fixtures/expected_scores.json';
import seed from '../../assets/seed.json';
import index from '../../assets/demo-readings/INDEX.json';
import p01aReal from '../../assets/demo-readings/variants/p01a_real.json';
import p01bSlim from '../../assets/demo-readings/variants/p01b_chinos_slim.json';
import p01bReal from '../../assets/demo-readings/variants/p01b_real.json';
import s24ChinoShorts from '../../assets/demo-readings/variants/s24_chino_shorts_generic.json';
import s24ClosetShoes from '../../assets/demo-readings/variants/s24_closet_shoes.json';
import s24Jeans from '../../assets/demo-readings/variants/s24_jeans.json';
import s24JeansGeneric from '../../assets/demo-readings/variants/s24_jeans_generic.json';
import s24Snap from '../../assets/demo-readings/variants/s24_shoe_snap_runners.json';
import { demoReadingById } from '@/services/readingSource/demoReadings';
import { OCCASIONS } from '@/data/types';
import { addedDetail } from '@/features/added/addedDetail';
import { evaluateCheck } from '@/features/fitcheck/scoring';
import { whatIRead } from '@/features/fitcheck/labels';
import { whyRows } from '@/features/why/ledgerRows';
import { displayScore } from '@/design-system/score';
import { en, t } from '@/i18n/en';

const BANNED: [string, RegExp][] = [
  ['"AI stylist"', /AI stylist/i],
  ['"unlimited"', /\bunlimited\b/i],
  ['emoji', /\p{Extended_Pictographic}/u],
  ['✓ ▾ ↑ glyphs', /[✓✔▾▼↑]/u],
];
const MAX_SCORE = 9.5;

function bannedIn(s: string): string[] {
  return BANNED.filter(([, re]) => re.test(s)).map(([name]) => name);
}

const VARIANTS = { p01aReal, p01bSlim, p01bReal, s24ChinoShorts, s24ClosetShoes, s24Jeans, s24JeansGeneric, s24Snap } as unknown as Record<string, Reading>;
const readings: [string, Reading][] = [
  ...index.photos.map((p) => [p.id, demoReadingById(p.id)!] as [string, Reading]),
  ...Object.entries(VARIANTS).map(([name, r]) => [`variant ${name}`, r] as [string, Reading]),
];
const STYLES = expected.profile.styles as unknown as Styles;
const closet = seed.scenarios.full.closet as unknown as ClosetItem[];

describe('copy deck and build strings', () => {
  it('no banned words or glyphs in any string', () => {
    const hits = Object.entries(en).flatMap(([k, v]) => bannedIn(v).map((b) => `${k}: ${b}`));
    expect(hits).toEqual([]);
  });

  it('every {placeholder} in a template is a plain name (so t() can fill it)', () => {
    const bad = Object.entries(en).filter(([, v]) => /[{}]/.test(v.replace(/\{[a-zA-Z0-9]+\}/g, ''))).map(([k]) => k);
    expect(bad).toEqual([]);
  });
});

describe('what the cards say, for every demo reading', () => {
  it('reads all 12 demo photos plus the variants', () => expect(readings.length).toBe(20));
  for (const [file, reading] of readings) {
    it(file, () => {
      const problems: string[] = [];
      const check = (where: string, s: string | null | undefined) => {
        if (!s) return;
        for (const b of bannedIn(s)) problems.push(`${where}: ${b} in "${s}"`);
        if (/[{}]/.test(s)) problems.push(`${where}: unfilled placeholder in "${s}"`);
      };
      for (const occasion of OCCASIONS) {
        for (const [closetName, items] of [['empty', []], ['full', closet]] as const) {
          for (const firstCheck of [false, true]) {
            const at = `${occasion}/${closetName}${firstCheck ? '/first' : ''}`;
            const ev = evaluateCheck({ reading, occasion, styles: STYLES, boldness: null, closet: [...items], firstCheck });
            if (ev.scored?.overall !== undefined && ev.scored.overall !== null && ev.scored.overall > MAX_SCORE) problems.push(`${at}: score ${ev.scored.overall}`);
            check(`${at} summary`, ev.summary);
            check(`${at} partial`, ev.partial);
            for (const f of ev.fixes.fixes) {
              if (f.to > MAX_SCORE) problems.push(`${at}: fix "${f.copy}" → ${f.to}`);
              check(`${at} fix`, f.copy);
              check(`${at} fix tag`, f.tag);
              check(`${at} fix gain`, t('card.gainTo', { score: displayScore(f.to) }));
            }
            for (const s of [...ev.fixes.nextLevel, ...ev.fixes.tips]) check(`${at} tip`, s);
            const why = whyRows(reading, occasion, STYLES, null);
            for (const row of why?.rows ?? []) {
              check(`${at} why`, row.rule);
              check(`${at} why item`, row.item);
              check(`${at} why value`, row.valueText);
            }
          }
        }
      }
      for (const s of whatIRead(reading)) check('what I read', s);
      expect(problems).toEqual([]);
    });
  }

  it('closet rows ("Top · Regular fit") for every seed item', () => {
    const lines = closet.map((c) => addedDetail({ slot: c.slot as never, garment: c.garment }));
    for (const s of lines) expect([bannedIn(s), /[{}]/.test(s)]).toEqual([[], false]);
  });
});
