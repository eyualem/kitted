// Shared by the T102 tests (kitCards, kitCardsStored, kitFollowUps): a small closet built from named pieces, the card
// builder's inputs for it, and a pipeline harness whose model is a script. Nothing here is the unit under test.
import { FAMILY_HEX, G, outfitValid, US_EASTERN, type ClosetItem, type Garment } from '@kitted/core';
import { createMemoryStore } from '@/data/memoryStore';
import type { ChatMessage, ClosetItemRow } from '@/data/types';
import type { CardInput } from '@/features/ask/cards';
import { buildStylistContext } from '@/features/ask/context';
import type { GateContext } from '@/features/ask/gate';
import { createAsk, type AskDeps } from '@/features/ask/pipeline';
import { createPrepare } from '@/features/ask/prepare';
import { loadStylistSnapshot } from '@/features/ask/snapshot';
import type { AnswerEvent, AnswerRequest, AnswerSource } from '@/features/ask/source';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { createQuota } from '@/services/quota';

export const NOW = Date.parse('2026-10-22T12:30:00-04:00');
export const GATE: GateContext = { allowedScores: new Set<string>() };

/** The inputs T102 adds to `CardInput` (optional, so every existing caller stays valid). */
export type Input = CardInput & {
  shownToday?: ReadonlySet<string>;
  avoid?: ReadonlySet<string>;
  allowedColors?: ReadonlySet<string> | null;
};

type Slot = 'top' | 'bottom' | 'shoes' | 'outer';

/** His pieces by short key: [name, slot, garment]. Each is a clean, clearly read piece (`G`). */
const CATALOG: Readonly<Record<string, readonly [string, Slot, Garment]>> = {
  tee: ['White tee', 'top', G('top', 'tee', 'white')],
  crew: ['Navy crewneck', 'top', G('top', 'sweater', 'navy')],
  oxford: ['Light-blue oxford', 'top', G('top', 'oxford_shirt', 'light_blue')],
  oliveSweater: ['Olive sweater', 'top', G('top', 'sweater', 'olive')],
  olive: ['Olive overshirt', 'outer', G('outerwear', 'overshirt', 'olive')],
  bomber: ['Tan bomber', 'outer', G('outerwear', 'bomber', 'tan_camel')],
  denimJkt: ['Denim jacket', 'outer', G('outerwear', 'denim_jacket', 'denim_mid')],
  jeans: ['Dark jeans', 'bottom', G('bottom', 'jeans', 'denim_dark', { leg_shape: 'straight' })],
  chinos: ['Khaki chinos', 'bottom', G('bottom', 'chinos', 'khaki_beige', { leg_shape: 'straight' })],
  joggers: ['Grey joggers', 'bottom', G('bottom', 'joggers', 'grey', { leg_shape: 'relaxed' })],
  sneakers: ['White sneakers', 'shoes', G('footwear', 'white_leather_sneaker', 'white')],
  boots: ['Black work boots', 'shoes', G('footwear', 'work_boot', 'black')],
  slides: ['Black slides', 'shoes', G('footwear', 'slides_sandals', 'black')],
};

export const pieceKeys = Object.keys(CATALOG);

export function row(id: string, name: string, slot: Slot, garment: Garment, extra: Partial<ClosetItemRow> = {}): ClosetItemRow {
  return {
    id, name, slot, garment, confirmedFields: [], hex: FAMILY_HEX[String(garment.color_family)] ?? '#9CA0A6', photoFile: null, demoPhotoId: null,
    isPhotographed: true, source: 'added', starterId: null, wornCount: 0, lastWornAt: null, addedAt: 1, isDeleted: false, mergedInto: null,
    maybeSameAs: null, cropFile: null, cropScore: null, updatedAt: 1, profile: null, ...extra,
  };
}

/** One of his pieces from the catalog: its row id is the key, so a test reads `k.id('jeans')`. */
export const rowOf = (key: string, extra: Partial<ClosetItemRow> = {}): ClosetItemRow => {
  const c = CATALOG[key];
  if (!c) throw new Error(`no catalog piece ${key}`);
  return row(key, c[0], c[1], c[2], extra);
};

/** The card builder's inputs for a closet made of these catalog keys (handles P1, P2… in the order given). */
export function kit(keys: readonly string[], over: Partial<Input> = {}) {
  const rows = keys.map((k) => rowOf(k));
  return kitOver(rows, over);
}

export function kitOver(rows: readonly ClosetItemRow[], over: Partial<Input> = {}) {
  const handles: Record<string, string> = {};
  rows.forEach((r, i) => (handles[`P${i + 1}`] = r.id));
  const input: Input = { handles, closet: rows, checks: [], styles: null, starterMarks: [], gate: GATE, ...over };
  const h = (key: string): string => {
    const hit = Object.entries(handles).find(([, id]) => id === key);
    if (!hit) throw new Error(`no handle for ${key}`);
    return hit[0];
  };
  return { rows, input, h, id: (key: string) => key };
}

/** The rubric's own verdict on a combination of catalog pieces plus extra garments (a test never relies on one unchecked). */
export function valid(keys: readonly string[], drawn: readonly Garment[] = []): boolean {
  const items = [
    ...keys.map((k) => ({ id: k, name: CATALOG[k]![0], slot: CATALOG[k]![1], garment: CATALOG[k]![2] })),
    ...drawn.map((g, i) => ({ id: `d${i}`, name: `d${i}`, slot: ({ top: 'top', bottom: 'bottom', footwear: 'shoes', outerwear: 'outer' } as Record<string, string>)[String(g.category)]!, garment: g })),
  ] as unknown as ClosetItem[];
  return outfitValid(items, null);
}

// ---------------------------------------------------------------- the pipeline with a scripted model
type HandleOf = (rowId: string) => string;

export async function harness(
  rows: readonly ClosetItemRow[],
  reply: (question: string, h: HandleOf, req: AnswerRequest) => AnswerEvent[],
  o: { chat?: readonly ChatMessage[]; isPro?: boolean; askDeps?: Partial<AskDeps>; setup?: (store: ReturnType<typeof createMemoryStore>, clock: ReturnType<typeof manualClock>) => Promise<void> } = {},
) {
  const store = createMemoryStore();
  const clock = manualClock(NOW, US_EASTERN);
  for (const r of rows) await store.closet.put(r);
  for (const m of o.chat ?? []) await store.chat.put(m);
  await o.setup?.(store, clock);
  const quota = createQuota({ store, clock, isPro: () => o.isPro ?? true });
  const ids = counterIds();
  const requests: AnswerRequest[] = [];
  const source: AnswerSource = {
    name: 'script',
    async *answer(req) {
      requests.push(req);
      const snap = await loadStylistSnapshot(store, clock);
      const ctx = buildStylistContext(snap, req.question);
      const h: HandleOf = (rowId) => {
        const hit = Object.entries(ctx.handles).find(([, v]) => v === rowId);
        if (!hit) throw new Error(`no handle for ${rowId}`);
        return hit[0];
      };
      for (const e of reply(req.question, h, req)) yield e;
    },
  };
  const make = () => createAsk({
    store, quota, clock, ids, source: () => source, prepare: createPrepare({ store, clock, ids }), consent: async () => true, openConsent: () => {}, tryPro: () => false, ...o.askDeps,
  });
  const ask = make();
  const run = async (q: string, via: ReturnType<typeof createAsk> = ask) => {
    const out = await via.ask(q);
    if (out.kind !== 'sent') throw new Error(`not sent: ${out.kind}`);
    const r = await out.done;
    if (r.kind !== 'answered') throw new Error(`failed ${r.code}`);
    clock.advance(5_000); // the next question comes later, so the thread sorts by time
    return (await store.chat.get(r.messageId))!;
  };
  return { store, clock, quota, ask, make, run, requests };
}

export const says = (text: string, done: Record<string, unknown> = {}): AnswerEvent[] => [
  { type: 'delta', text },
  { type: 'done', ...done } as AnswerEvent,
];
