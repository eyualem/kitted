// Starter basics that follow his looks (09-ui-review §16, #364; the founder's OK Oct 17). The catalog lives in
// finish/starter.ts (today's s01–s12 plus the looks' s13–s38; ids never removed or renumbered: closet rows, kv marks and
// chat cards store them); this file holds one ranked list of 12 per look, built from rubric/v5-styles.md's signature and
// home pieces, and the blend of his up to 3 picks. No picks (or "Not sure") keeps today's 12. The list is what Next best
// buy, "Add shoes and you'd have n" and Kit's buy cards choose from; "What you already own" keeps today's 12 (#343). It
// only chooses candidates: every "+N" is still the Closet's count (finish/gains.ts, #309) and no list changes a score
// (#211). Pure.
import type { Styles } from '@kitted/core';
import { normStyleKey, type StyleKey } from '@/data/types';
import { CATALOG, catalogRow, LOOK_ROWS, STARTER, type StarterEntry } from './starter';

export { CATALOG, catalogRow, LOOK_ROWS };

/** In every list: the white tee, white leather sneakers and the belt. */
export const CORE_IDS = ['s01', 's09', 's12'] as const;
/** No picks, or "Not sure": today's 12 in today's order. */
export const COMMON_IDS: readonly string[] = STARTER.map((e) => e.id);
export const LIST_SIZE = 12;

export interface LookPack {
  /** 12 rows, most useful first (the order on screen and the tie-break for "+N"). */
  ids: readonly string[];
  /** The plain outfit that defines the look, from v5-styles' own examples: the rules test runs every piece against it. */
  anchor: { top: string; bottom: string; shoes: string; outer?: string };
  /** The look's own pieces (signature or home in v5-styles): swapped into the anchor, the outfit still reads as the look. */
  own: readonly string[];
}

// T94 (founder 2): Tailored has no pack yet (the catalog has no blazer, trousers or derbies); a Tailored pick is skipped.
export const PACKS: Readonly<Partial<Record<StyleKey, LookPack>>> = {
  // [STR-1]/[STR-2]: "Grey hoodie + wide jeans + chunky sneakers reads as streetwear".
  streetwear: {
    ids: ['s15', 's13', 's18', 's14', 's17', 's16', 's19', 's01', 's09', 's21', 's20', 's12'],
    anchor: { top: 's15', bottom: 's13', shoes: 's18' },
    own: ['s15', 's13', 's18', 's14', 's17', 's16', 's19', 's21', 's20', 's01', 's09'],
  },
  // [MIN-2]/[MIN-4]: a sweater over wide trousers with loafers.
  minimalist: {
    ids: ['s04', 's23', 's24', 's14', 's06', 's01', 's09', 's22', 's25', 's05', 's07', 's12'],
    anchor: { top: 's04', bottom: 's23', shoes: 's24' },
    own: ['s04', 's23', 's24', 's14', 's06', 's09', 's25', 's07'],
  },
  // [SMC-4]: "a navy polo with chinos and white leather sneakers is smart casual top to toe". Today's list, unchanged.
  smart_casual: {
    ids: COMMON_IDS,
    anchor: { top: 's02', bottom: 's06', shoes: 's09' },
    own: ['s02', 's03', 's04', 's06', 's07', 's09', 's10', 's11', 's05'],
  },
  // [WRK-1]/[WRK-4]: "A tan chore coat over a white tee with dark jeans and work boots reads as workwear".
  workwear: {
    ids: ['s26', 's27', 's05', 's21', 's01', 's28', 's17', 's29', 's22', 's04', 's09', 's12'],
    anchor: { top: 's01', bottom: 's05', shoes: 's27', outer: 's26' },
    own: ['s26', 's27', 's05', 's21', 's28', 's17', 's29'],
  },
  // [PRP-1]: a collared top in a color (the light-blue oxford) with chinos and loafers. The knit and the quarter-zip
  // are prep's home pieces: worn as the one top (the closet's outfits have one), they read smart casual, so not `own`.
  classic_prep: {
    ids: ['s03', 's02', 's06', 's10', 's30', 's04', 's31', 's11', 's01', 's05', 's09', 's12'],
    anchor: { top: 's03', bottom: 's06', shoes: 's10' },
    own: ['s03', 's02', 's06', 's10', 's30', 's31', 's09'],
  },
  // [VSP-1]: "A green jersey + dark straight jeans + retro runners reads as vintage sport".
  vintage_sport: {
    ids: ['s32', 's31', 's33', 's34', 's05', 's35', 's16', 's06', 's01', 's09', 's19', 's12'],
    anchor: { top: 's32', bottom: 's05', shoes: 's33' },
    own: ['s32', 's31', 's33', 's34', 's05', 's35', 's06'],
  },
  // [OUT-1]: "An orange shell over a tee with olive cargos and low-profile sneakers reads as outdoor".
  outdoor: {
    ids: ['s36', 's37', 's17', 's38', 's01', 's22', 's21', 's05', 's16', 's20', 's09', 's12'],
    anchor: { top: 's01', bottom: 's17', shoes: 's38', outer: 's37' },
    own: ['s36', 's37', 's17', 's38', 's21'],
  },
};

/** One piece would fill both rows (his one pair of wide jeans showing as two basics): never both in one list. */
export function overlaps(a: StarterEntry, b: StarterEntry): boolean {
  if (a.id === b.id || !a.pick || !b.pick || !a.slot || !b.slot) return false;
  return (a.slot === b.slot && a.fills(b.pick.garment, b.slot)) || (b.slot === a.slot && b.fills(a.pick.garment, a.slot));
}

/** His picks as looks, in his order: old keys mapped, unknown and repeats dropped, at most 3. */
export function picksOf(styles: Styles | null): StyleKey[] {
  const out: StyleKey[] = [];
  for (const [name] of styles ?? []) {
    const k = normStyleKey(name);
    if (k && !out.includes(k)) out.push(k);
  }
  return out.slice(0, 3);
}

/** How many of the 9 non-core rows each pick gets, by his order. */
export const QUOTAS: Readonly<Record<1 | 2 | 3, readonly number[]>> = { 1: [9], 2: [6, 3], 3: [4, 3, 2] };

const byId = (id: string): StarterEntry => {
  const e = catalogRow(id);
  if (!e) throw new Error(`no Starter row ${id}`);
  return e;
};

/**
 * His 12 candidate basics. No picks: today's 12. One pick: that look's 12. Two or three: the core,
 * then each pick's best rows by QUOTAS in his order, skipping a row already in or one that overlaps one in; any slot left
 * is refilled from his picks in order, then today's list. Order on screen: his first pick's list order, then each later
 * pick's rows in theirs, so ties in "+N" go to his first pick.
 */
export function starterList(styles: Styles | null): StarterEntry[] {
  const looks = picksOf(styles).filter((k) => PACKS[k]);
  if (looks.length === 0) return COMMON_IDS.map(byId);
  const packs = looks.map((k) => PACKS[k]!);
  if (packs.length === 1) return packs[0]!.ids.map(byId);
  const chosen: StarterEntry[] = CORE_IDS.map(byId);
  const add = (id: string): boolean => {
    const e = byId(id);
    if (chosen.some((c) => c.id === id || overlaps(c, e))) return false;
    chosen.push(e);
    return true;
  };
  const nonCore = (p: LookPack) => p.ids.filter((id) => !(CORE_IDS as readonly string[]).includes(id));
  const quota = QUOTAS[packs.length as 2 | 3];
  packs.forEach((p, i) => {
    let took = 0;
    for (const id of nonCore(p)) {
      if (took >= quota[i]!) break;
      if (add(id)) took += 1;
    }
  });
  for (const id of [...packs.flatMap(nonCore), ...COMMON_IDS]) {
    if (chosen.length >= LIST_SIZE) break;
    add(id);
  }
  const ids = new Set(chosen.map((e) => e.id));
  const order: string[] = [];
  for (const p of packs) for (const id of p.ids) if (ids.has(id) && !order.includes(id)) order.push(id);
  for (const e of chosen) if (!order.includes(e.id)) order.push(e.id);
  return order.map(byId);
}
