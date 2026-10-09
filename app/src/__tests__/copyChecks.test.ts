// Automated copy checks (P2): over every string in the app and over what the cards actually say
// for every demo reading × occasion × closet × first check. Rules from CLAUDE.md "Wording":
// never "AI stylist", never "unlimited", no emoji or ✓ ▾ ↑ glyphs (SF Symbols draw those),
// no unfilled {placeholder}, and no score above 9.5.
import { RUBRIC_DATA, type ClosetItem, type Reading, type Styles } from '@kitted/core';
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
import ph1 from '../../assets/demo-readings/variants/ph1_oct7_misread.json';
import { demoReadingById } from '@/services/readingSource/demoReadings';
import { OCCASIONS } from '@/data/types';
import { addedDetail } from '@/features/added/addedDetail';
import { evaluateCheck } from '@/features/fitcheck/scoring';
import { whatIRead } from '@/features/fitcheck/labels';
import { whyRows } from '@/features/why/ledgerRows';
import { displayScore } from '@/design-system/score';
import { en, t } from '@/i18n/en';
import schemaV3 from '../../assets/gemini/schema-v3.json';
import { createMemoryStore } from '@/data/memoryStore';
import { createClosetService } from '@/features/closet/service';
import { createFitCheckService, DEFAULT_TIMERS } from '@/features/fitcheck/service';
import { manualClock } from '@/services/clock';
import { createMockClosetSource } from '@/services/closetSource/mock';
import { counterIds } from '@/services/ids';
import { demoImagePrep } from '@/services/imagePrep/demo';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { realScheduler } from '@/services/scheduler';

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

const VARIANTS = { p01aReal, p01bSlim, p01bReal, s24ChinoShorts, s24ClosetShoes, s24Jeans, s24JeansGeneric, s24Snap, ph1 } as unknown as Record<string, Reading>;
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

describe('the one quick tap and "Reads as" strings', () => {
  const deck = en as Record<string, string | undefined>;
  it("every question and answer label is core's text, word for word", () => {
    const problems: string[] = [];
    for (const pairs of Object.values(RUBRIC_DATA.tap.pairs)) {
      for (const [a, b, q] of pairs) if (deck[`tap.q.${a}_${b}`] !== q) problems.push(`tap.q.${a}_${b}`);
    }
    for (const [v, label] of Object.entries(RUBRIC_DATA.tap.labels)) {
      if (deck[`tap.opt.${v}`] !== label) problems.push(`tap.opt.${v}`);
      const inSentence = label.startsWith('Chelsea') ? label : label.charAt(0).toLowerCase() + label.slice(1);
      if (deck[`tap.as.${v}`] !== inSentence) problems.push(`tap.as.${v}`);
    }
    // tap v2 (#120): the shoe question and its three kinds
    const shoes = RUBRIC_DATA.tap.shoes;
    if (deck[`tap.q.${shoes.order.join('_')}`] !== shoes.question) problems.push('tap.q.shoes');
    for (const k of shoes.order) {
      if (deck[`tap.opt.${k}`] !== shoes.labels[k]) problems.push(`tap.opt.${k}`);
      if (deck[`tap.as.${k}`] !== shoes.labels[k].toLowerCase()) problems.push(`tap.as.${k}`);
    }
    expect(problems).toEqual([]);
    // + "Your {item}?" with Yes / No (#126): app copy, not core's
    expect(Object.keys(en).filter((k) => k.startsWith('tap.q.'))).toHaveLength(11);
    expect(Object.keys(en).filter((k) => k.startsWith('tap.opt.'))).toHaveLength(18);
    expect(Object.keys(en).filter((k) => k.startsWith('tap.as.'))).toHaveLength(16);
  });
  it('the "Scored for" strings are gone', () => {
    expect(Object.keys(en).filter((k) => k.startsWith('scoredFor.') || k.startsWith('why.style.'))).toEqual([]);
  });
});

describe('what the cards say, for every demo reading', () => {
  it('reads all 12 demo photos plus the variants', () => expect(readings.length).toBe(21));
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
            const why = whyRows(reading, occasion, STYLES, null, ev.row.details.readsAs ?? null);
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

describe('closet names (#91)', () => {
  // Every word a closet name can use comes from a fixed table: the app's color words, the shade step / finish
  // words, the known brands, garment names and detail words. The model's own shade or logo text never shows.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const core = require('@kitted/core') as typeof import('@kitted/core');
  const COLORS = ['white', 'cream', 'light', 'grey', 'charcoal', 'black', 'navy', 'light-blue', 'blue', 'mid-wash', 'dark', 'olive', 'green', 'sage', 'beige', 'khaki', 'tan', 'brown', 'burgundy', 'red', 'orange', 'yellow', 'pink', 'purple', 'multicolor'];
  const SHADE = ['light', 'medium', 'dark', 'heather', 'washed', 'faded', 'raw'];
  const BRANDS = ['nike', 'jordan', 'adidas', 'puma', 'new', 'balance', 'under', 'armour', 'north', 'face', 'patagonia', 'carhartt', 'champion', 'ralph', 'lauren', 'lacoste', 'tommy', 'hilfiger', 'calvin', 'klein', "levi's", 'gap', 'uniqlo', 'h&m', 'zara', 'supreme', 'stussy', 'essentials', 'vans', 'converse', 'reebok', 'asics', 'columbia', "arc'teryx", 'lululemon', 'gymshark', 'abercrombie', 'american', 'eagle', 'hollister', 'guess', 'boss', 'timberland', 'dr.', 'martens', 'era', 'kith'];
  const DETAILS = ['zip', 'half-zip', 'pullover', 'cargo', 'striped', 'pleated', 'raw-hem', 'pocket', 'collared', 'hooded', 'drawstring', 'cuffed', 'button-front', 'belted', 'ripped', 'faded', 'chunky', 'slim'];
  const SUBS = (schemaV3 as { properties: { garments: { items: { properties: { subcategory: { enum: string[] } } } } } }).properties.garments.items.properties.subcategory.enum;
  const GARMENT = SUBS.flatMap((s) => core.garmentName({ subcategory: s }).toLowerCase().split(' '));
  const ALLOWED = new Set([...COLORS, ...SHADE, ...BRANDS, ...DETAILS, ...GARMENT.filter((w) => w !== 'other'), 'top', 'layer', 'bottoms', 'shoes', ...'23456789'.split('')]);

  it('names for every demo photo come only from the fixed tables', async () => {
    const bad: string[] = [];
    let names = 0;
    for (const id of ['p01a', 'p01b', 's05', 's09', 's10', 's12', 's13', 's14', 's15', 's22', 's24', 's25', 'ph1']) {
      const store = createMemoryStore();
      const clock = manualClock(Date.parse('2026-10-22T07:42:00-04:00'));
      const ids = counterIds();
      const closet = createClosetService({ store, clock, scheduler: realScheduler, ids, source: createMockClosetSource() });
      const svc = createFitCheckService({
        store, source: createMockReadingSource({ latency: () => 0, scheduler: realScheduler }), prep: demoImagePrep,
        quota: createQuota({ store, clock, isPro: () => true }), clock, scheduler: realScheduler, ids, closet,
        timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }), tap: () => false,
      });
      await svc.start({ mode: 'check', photoId: id, occasion: 'everyday' });
      await closet.settle();
      for (const c of await store.closet.all()) {
        for (const w of c.name.toLowerCase().split(' ')) if (!ALLOWED.has(w)) bad.push(`${id}: "${c.name}" (${w})`);
        expect(bannedIn(c.name)).toEqual([]);
        names += 1;
      }
    }
    expect(bad).toEqual([]);
    expect(names).toBeGreaterThan(30);
  });
});
