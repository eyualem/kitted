// Closet names (DECISIONS-LOG #91, #115): "{shade} {pattern} {Brand} {detail} {garment}", e.g. "Medium grey Nike hoodie",
// "Tan plaid overshirt".
// - The color words come only from fixed tables: core shadeWords' step / finish words + the app's color word
//   (labels.ts colorWord), never the model's text. Denim keeps its wash word ("Dark jeans"), plus a finish.
// - A brand only from the known list (core normalizeBrand ids), or one clean word that 2 sightings agree on.
// - A detail word ("zip", "pullover") only when two of his pieces would otherwise share a name; it then sticks.
// - A name he typed is never changed; the mockup-drawn seed names are kept as they are.
import { FAMILY_WORD, garmentName, shadeFromId, shadeWords, type Garment } from '@kitted/core';
import type { ClosetArt, ClosetItemRow } from '@/data/types';
import { colorWord, garmentLabel } from '@/features/fitcheck/labels';
import { isVariant, VARIANTS } from './kinds';
import { profileOfItem } from './profile';

const BRAND_NAME: Readonly<Record<string, string>> = {
  nike: 'Nike', jordan: 'Jordan', adidas: 'Adidas', puma: 'Puma', new_balance: 'New Balance', under_armour: 'Under Armour',
  the_north_face: 'North Face', patagonia: 'Patagonia', carhartt: 'Carhartt', champion: 'Champion', ralph_lauren: 'Ralph Lauren',
  lacoste: 'Lacoste', tommy_hilfiger: 'Tommy Hilfiger', calvin_klein: 'Calvin Klein', levis: "Levi's", gap: 'Gap', uniqlo: 'Uniqlo',
  hm: 'H&M', zara: 'Zara', supreme: 'Supreme', stussy: 'Stussy', fear_of_god: 'Essentials', vans: 'Vans', converse: 'Converse',
  reebok: 'Reebok', asics: 'Asics', columbia: 'Columbia', arcteryx: "Arc'teryx", lululemon: 'Lululemon', gymshark: 'Gymshark',
  abercrombie: 'Abercrombie', american_eagle: 'American Eagle', hollister: 'Hollister', guess: 'Guess', hugo_boss: 'Boss',
  timberland: 'Timberland', dr_martens: 'Dr. Martens', new_era: 'New Era', kith: 'Kith',
};

/** The brand word to show, or null: a listed brand, or a "text:" brand that's one plain word (3–12 letters). */
export function brandWord(brand: string | null | undefined): string | null {
  if (!brand || brand === 'none' || brand === 'unreadable') return null;
  if (BRAND_NAME[brand]) return BRAND_NAME[brand]!;
  if (brand.startsWith('text:')) {
    const w = brand.slice(5);
    return /^[a-z]{3,12}$/.test(w) ? w.charAt(0).toUpperCase() + w.slice(1) : null;
  }
  return null;
}

/** "medium grey", "heather grey", "faded dark", "khaki" (lowercase). */
export function colorPhrase(family: string | null | undefined, shade: string | null | undefined, subcategory?: unknown): string {
  const fam = typeof family === 'string' ? family : '';
  const base = colorWord({ color_family: fam, subcategory: typeof subcategory === 'string' ? subcategory : undefined })?.toLowerCase() ?? '';
  if (!base) return '';
  const key = shade ? shadeFromId(shade) : null;
  const famWord = FAMILY_WORD[fam];
  if (!key || !famWord || fam === 'multicolor') return base;
  const full = shadeWords(fam, fam.startsWith('denim') ? { ...key, step: null } : key);
  const mods = full.endsWith(famWord) ? full.slice(0, full.length - famWord.length).trim().split(' ').filter(Boolean) : [];
  return [...mods.filter((w) => w !== 'pale' && w !== 'deep'), base].join(' ');
}

/** Detail words, best first: what tells two of the same piece apart. */
const DETAIL_WORDS: readonly (readonly [string, string])[] = [
  ['full_zip', 'zip'], ['half_zip', 'half-zip'], ['front_pouch', 'pullover'], ['cargo_pockets', 'cargo'], ['side_stripe', 'striped'],
  ['pleats', 'pleated'], ['raw_hem', 'raw-hem'], ['chest_pocket', 'pocket'], ['collar', 'collared'], ['hood', 'hooded'],
  ['drawstring', 'drawstring'], ['elastic_cuffs', 'cuffed'], ['buttons', 'button-front'], ['belt_loops', 'belted'],
];

export function detailWordsOf(art: Pick<ClosetArt, 'details' | 'denimWear' | 'shoeProfile'> | null | undefined): string[] {
  if (!art) return [];
  const out: string[] = [];
  if (art.denimWear === 'ripped') out.push('ripped');
  if (art.denimWear === 'faded') out.push('faded');
  for (const [d, w] of DETAIL_WORDS) if (art.details.includes(d)) out.push(w);
  if (art.shoeProfile === 'chunky') out.push('chunky');
  if (art.shoeProfile === 'sleek') out.push('slim');
  return out;
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const OTHER: Readonly<Record<string, string>> = { top: 'top', outerwear: 'layer', bottom: 'bottoms', footwear: 'shoes' };
/** The garment noun ("hoodie"); a closet-only kind he picked says itself ("long-sleeve tee", #338); an "other" type
 *  says what kind of piece it is ("Black top"). */
function pieceWord(g: Garment, art?: ClosetArt | null): string {
  if (isVariant(art?.kind) && VARIANTS[art!.kind!]!.sub === g.subcategory) return VARIANTS[art!.kind!]!.noun;
  const n = garmentName(g);
  return n === 'other' || n === 'piece' ? OTHER[String(g.category)] ?? 'piece' : n;
}

/** The name without a detail word. */
export function baseName(garment: Garment, art: ClosetArt | null | undefined): string {
  return composeName(garment, art, null);
}

/** Strong patterns tell two pieces of one color apart at a glance (#115): "Tan plaid overshirt". */
const PATTERN_WORD: Readonly<Record<string, string>> = { stripes: 'striped', checks_plaid: 'plaid', camo: 'camo', floral: 'floral' };
export function patternWord(pattern: string | null | undefined): string | null {
  return pattern ? PATTERN_WORD[pattern] ?? null : null;
}

export function composeName(garment: Garment, art: ClosetArt | null | undefined, detail: string | null): string {
  const color = colorPhrase(art?.family ?? garment.color_family, art?.shade ?? null, garment.subcategory);
  const pattern = patternWord(art ? art.pattern : garment.pattern as string | undefined);
  const noun = pieceWord(garment, art);
  // never "zip zip hoodie": a detail the noun already says is left out
  const extra = detail === pattern || (detail && noun.split(/[ -]/).includes(detail)) ? null : detail;
  const parts = [color, pattern, brandWord(art?.brand), extra, noun].filter((p): p is string => !!p);
  return cap(parts.join(' '));
}

/** Names the app may change: ones it made itself (or a pre-V6 auto name), never his own or the seed's. */
export function isAutoNamed(item: Pick<ClosetItemRow, 'profile' | 'source' | 'name' | 'garment'>): boolean {
  if (!item.profile) return item.source === 'fitCheck' && item.name === garmentLabel(item.garment); // a pre-V6 auto name
  return !item.profile.nameLocked && item.profile.autoName === true;
}

/**
 * Names for his owned pieces: auto-named items get "{shade} {Brand} {garment}". When two would share it, the
 * older keeps it and the newer gets a detail word that tells them apart ("zip"), or a number when none does.
 * A detail word, once given, sticks. Other names (his own, the seed's) stay and are stepped around.
 * Returns id -> { name, nameDetail } for every auto-named item.
 */
export function assignNames(items: readonly ClosetItemRow[]): Map<string, { name: string; nameDetail: string | null }> {
  const out = new Map<string, { name: string; nameDetail: string | null }>();
  const auto = items.filter(isAutoNamed);
  const fixed = new Set(items.filter((i) => !isAutoNamed(i)).map((i) => i.name.toLowerCase()));
  const groups = new Map<string, ClosetItemRow[]>();
  for (const it of auto) {
    const b = baseName(it.garment, it.art).toLowerCase();
    groups.set(b, [...(groups.get(b) ?? []), it]);
  }
  const byAge = (a: ClosetItemRow, b: ClosetItemRow) => a.addedAt - b.addedAt || (a.id < b.id ? -1 : 1);
  for (const [b, group] of groups) {
    const sorted = [...group].sort(byAge);
    if (sorted.length === 1 && !fixed.has(b)) {
      const it = sorted[0]!;
      const sticky = profileOfItem(it).nameDetail ?? null;
      const keep = sticky && detailWordsOf(it.art).includes(sticky) ? sticky : null;
      out.set(it.id, { name: composeName(it.garment, it.art, keep), nameDetail: keep });
      continue;
    }
    const taken = new Set<string>(fixed);
    const words = new Map(sorted.map((it) => [it.id, detailWordsOf(it.art)]));
    for (const it of sorted) {
      const mine = words.get(it.id)!;
      const others = sorted.filter((o) => o.id !== it.id).map((o) => words.get(o.id)!);
      const sticky = profileOfItem(it).nameDetail ?? null;
      const unique = mine.find((w) => others.every((o) => !o.includes(w)));
      const some = mine.find((w) => others.some((o) => !o.includes(w)));
      const order = sticky && mine.includes(sticky) ? [sticky, null, unique ?? null, some ?? null] : [null, unique ?? null, some ?? null];
      let name = '';
      let detail: string | null = null;
      for (const w of order) {
        const n = composeName(it.garment, it.art, w);
        if (!taken.has(n.toLowerCase())) {
          name = n;
          detail = w;
          break;
        }
      }
      if (!name) {
        let k = 2;
        while (taken.has(`${baseName(it.garment, it.art)} ${k}`.toLowerCase())) k++;
        name = `${baseName(it.garment, it.art)} ${k}`;
      }
      taken.add(name.toLowerCase());
      out.set(it.id, { name, nameDetail: detail });
    }
  }
  return out;
}
