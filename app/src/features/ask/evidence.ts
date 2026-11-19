// The evidence for one question (07 §5.1, check R2): computed by code on the phone, only what the router's kind
// needs. Every number in it is one the code computed (a check's stored score and fix targets, the parts engine on a
// swap, "+N outfits" from rotation); the sentence gate lets the model say only those (gate.ts allowedScores).
// Outfits never carry a predicted score (R5). Pieces mentioned in chat (source 'chat') are used in outfits but never
// in a "+N outfits" count (07 §4).
import {
  addDays, allowedColors, COLOR_CHOICES, dayKey, daysBetween, G, localParts, pickOutfit, seasonNeeds, weatherNeeds,
  type AllowedColorsInput, type ClosetItem, type ColorFamily, type DayWeather, type Garment, type IdeaReason, type PastUse, type PickHistory, type Reading,
} from '@kitted/core';
import { OCCASIONS, type CardOccasion, type ClosetItemRow, type FitCheckRow, type OccasionKey } from '@/data/types';
import { displayScore } from '@/design-system/score';
import { isAwaitingAnswer, isOwned } from '@/features/closet/profile';
import { overallFor, scoreOptions } from '@/features/fitcheck/scoring';
import { starterGain } from '@/features/finish/gains';
import { starterList } from '@/features/finish/packs';
import { catalogRow, ownership } from '@/features/finish/starter';
import { whyLine } from '@/features/morning/copy';
import { HISTORY_DAYS, historyFor, ideaId, scoringOccasion, slotAt } from '@/features/morning/service';
import { occasionLabel } from '@/features/stylist/thread';
import { asBudget } from '@/features/you/profile';
import { fullCheckLines, oneLine, type StylistContext, type StylistSnapshot } from './context';
import { colorName, kindNoun, slotOfKind, storedCard, type AskCard } from './cards';
import { avoidedIds, avoidsPhrase, judgeOutfit, judgementLines } from './judge';
import { colorsNamed, scoresIn } from './gate';
import { garmentOf } from './memory';
import { t } from '@/i18n/en';
import type { AskKind } from './prompt';
import type { Route } from './router';

export interface Evidence {
  /** The <evidence> block ('' = none). */
  text: string;
  /** Kinds of lookup the model may still ask for (none once evidence was computed for the kind). */
  kind: AskKind;
  /** The rules' verdict on the outfit he asked about ("can I wear…", shape; J5), or absent. */
  verdict?: 'yes' | 'depends' | 'no';
}

export interface EvidenceDeps {
  /** A check's stored reading (what-if re-scores it). */
  readingOf: (readingId: string | null) => Promise<Reading | null>;
  /** Starter rows he marked as owned with no closet piece (kv), for "what to buy". */
  starterMarks: readonly string[];
  /** T105 KC3.3: the colors the rules would not mark down (core's `allowedColors` by default); a stand-in in tests. */
  allowedColors?: (input: AllowedColorsInput) => ColorFamily[];
}

/** A lookup the model asked for in its closing block (R3), in the router's terms. */
export interface Lookup {
  lookup: 'goes_with' | 'outfit' | 'explain' | 'buy_next';
  piece?: string;
  check?: string;
  occasion?: OccasionKey;
}


/** The model's `need`, checked: a known lookup, and handles that exist in this question's pack. Null otherwise. */
export function parseLookup(raw: unknown, handles: Readonly<Record<string, string>>): Lookup | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const lookup = o.lookup;
  if (lookup !== 'goes_with' && lookup !== 'outfit' && lookup !== 'explain' && lookup !== 'buy_next') return null;
  const piece = typeof o.piece === 'string' && /^P\d+$/.test(o.piece) && handles[o.piece] ? o.piece : undefined;
  const check = typeof o.check === 'string' && /^FC\d+$/.test(o.check) && handles[o.check] ? o.check : undefined;
  const occasion = typeof o.occasion === 'string' && (OCCASIONS as readonly string[]).includes(o.occasion) ? (o.occasion as OccasionKey) : undefined;
  if (lookup === 'goes_with' && !piece) return null;
  if (lookup === 'explain' && !check) return null;
  return { lookup, ...(piece ? { piece } : {}), ...(check ? { check } : {}), ...(occasion ? { occasion } : {}) };
}

/** A lookup as a route: the same evidence code answers both (R3). */
export function routeOfLookup(l: Lookup): Route {
  const kind: AskKind = l.lookup === 'goes_with' ? 'goesWith' : l.lookup === 'outfit' ? 'whatToWear' : l.lookup === 'explain' ? 'explain' : 'buyNext';
  return { kind, pieces: l.piece ? [l.piece] : [], check: l.check ?? null, occasion: l.occasion ?? null, sure: true };
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** His pieces outfits can use: owned, not waiting on "Same as…?". */
function usable(closet: readonly ClosetItemRow[]): ClosetItemRow[] {
  const owned = closet.filter(isOwned);
  return owned.filter((c) => !isAwaitingAnswer(c, owned));
}

/** Kit's own outfit cards from the days before today: shown, like a card's (#358). Today's don't count: the same
 *  question twice in a day gets the same advice. */
function kitCards(s: StylistSnapshot, today: string): PastUse[] {
  const from = addDays(today, -HISTORY_DAYS);
  const out: PastUse[] = [];
  for (const m of s.chat) {
    const c = storedCard(m.payload.askCard);
    if (!c || c.type !== 'outfit') continue;
    const d = dayKey(m.createdAt, s.zone);
    if (d >= from && d < today) out.push({ daysAgo: daysBetween(d, today), itemIds: c.itemIds });
  }
  return out;
}

function todaysWeather(s: StylistSnapshot): DayWeather | null {
  const today = dayKey(s.nowMs, s.zone);
  const idea = s.ideas.find((i) => i.dayKey === today && i.weather);
  return (idea?.weather as unknown as DayWeather | null) ?? null;
}

export async function buildEvidence(route: Route, s: StylistSnapshot, ctx: Pick<StylistContext, 'handles'>, deps: EvidenceDeps): Promise<Evidence> {
  const handleOf = new Map(Object.entries(ctx.handles).map(([h, id]) => [id, h]));
  const pieces = usable(s.closet);
  const named = (h: string) => pieces.find((c) => c.id === ctx.handles[h]);
  const nameOf = (c: ClosetItemRow) => `${handleOf.get(c.id) ?? '?'} ${oneLine(c.name, 60)}`;
  const checkOf = (h: string | null) => (h ? s.checks.find((c) => c.id === ctx.handles[h]) ?? null : null);
  const out: string[] = [];
  const styles = s.profile?.styles ?? null;
  // What he said he avoids leaves outfits and buys (J3); a piece he names himself is still used.
  const avoided = avoidedIds(pieces, s.facts);
  let verdict: 'yes' | 'depends' | 'no' | undefined;

  // Kit's outfit ideas rotate like the card (#358): the history of the card for the moment he asks in, plus Kit's
  // own outfit cards from earlier days. Today's card for that moment, when it planned an outfit, is the first pick.
  const now = slotAt(s.nowMs, s.zone);
  const nowId = ideaId(now.day, now.slot);
  const todaysCard = s.ideas.find((i) => i.id === nowId && !!i.outfitId) ?? null;
  const cardOccasion: OccasionKey | null = todaysCard && todaysCard.occasion !== 'staying_in' ? scoringOccasion(todaysCard.occasion) : null;
  let seen: PickHistory | null = null;
  const history = (): PickHistory => {
    if (!seen) {
      const items = new Map(s.outfits.map((o) => [o.id, o.itemIds]));
      seen = historyFor(
        { id: nowId, slot: now.slot, outfitId: todaysCard?.outfitId ?? null },
        { ideas: s.ideas, wears: s.wears, checks: s.checks, closet: s.closet, itemsOf: (id) => items.get(id) ?? [] },
        s.zone, kitCards(s, now.day),
      );
    }
    return seen;
  };

  /** One outfit line: its pieces by handle, its reasons and the rules' own words (no predicted score). */
  const lineOf = (label: string, occasion: OccasionKey, items: ClosetItemRow[], reasons: readonly IdeaReason[]): string[] => {
    const card: CardOccasion = occasion === 'gym' || occasion === 'home' ? 'everyday' : occasion;
    const why = oneLine(whyLine(reasons, items, card), 160);
    // The rules' own words on the same outfit (J2): a problem they'd find is said, never hidden.
    const j = judgeOutfit(items, occasion, styles);
    const careful = j?.problems.length ? ` · careful: ${oneLine(j.problems[0], 140)}` : '';
    return [`${label}: ${items.map(nameOf).join(' + ')}${why ? ` · why: ${why}` : ''}${careful}`, items.map((c) => c.id).join('+')];
  };

  /** Today's card's outfit, when it was planned for this occasion and every piece is still his to wear (#358). */
  const cardLine = (label: string, occasion: OccasionKey, pin?: string): string[] | null => {
    if (!todaysCard || cardOccasion !== occasion) return null;
    const row = s.outfits.find((o) => o.id === todaysCard.outfitId);
    if (!row || (pin && !row.itemIds.includes(pin))) return null;
    const items = row.itemIds.map((id) => pieces.find((c) => c.id === id));
    if (items.some((c) => !c || (avoided.has(c.id) && c.id !== pin))) return null;
    const reasons = (row.details as { reasons?: IdeaReason[] }).reasons ?? [];
    return lineOf(`${label} (${lower(occasionLabel(occasion))}, same as today's card)`, occasion, items as ClosetItemRow[], reasons);
  };

  /** One outfit line from the picker, or today's card's outfit when `fromCard` and it fits. */
  const outfitLine = (label: string, occasion: OccasionKey, pin?: string, exclude?: Set<string>, fromCard = false): string[] | null => {
    const fromToday = fromCard ? cardLine(label, occasion, pin) : null;
    if (fromToday) return fromToday;
    const month = localParts(s.nowMs, s.zone).m;
    const w = todaysWeather(s);
    const r = pickOutfit({
      closet: pieces as unknown as ClosetItem[], occasion, styles, needs: w ? weatherNeeds(w) : seasonNeeds(month), history: history(),
      seed: `${dayKey(s.nowMs, s.zone)}|ask|${label}|${pin ?? ''}`, ...(pin ? { pin } : {}),
      ...(exclude || avoided.size ? { exclude: new Set([...(exclude ?? []), ...[...avoided].filter((id) => id !== pin)]) } : {}),
    });
    // A pinned piece the picker couldn't fit in is no answer to "what goes with it".
    if (!r.outfit || (pin && !r.outfit.itemIds.includes(pin))) return null;
    const items = r.outfit.itemIds.map((id) => pieces.find((c) => c.id === id)).filter((c): c is ClosetItemRow => !!c);
    return lineOf(`${label} (${lower(occasionLabel(occasion))})`, occasion, items, r.outfit.reasons);
  };

  switch (route.kind) {
    case 'explain':
    case 'feedback': {
      const c = checkOf(route.check);
      if (!c || c.score === null) break;
      const checkHandle = new Map([...handleOf].filter(([, h]) => /^FC/.test(h)));
      const piecesOfCheck = (r: FitCheckRow) => r.itemIds.map((id) => pieces.find((p) => p.id === id)).filter((p): p is ClosetItemRow => !!p).map(nameOf);
      out.push(`The check he means: ${route.check}`, ...fullCheckLines(c, s.zone, checkHandle, piecesOfCheck));
      break;
    }
    case 'whatIf': {
      const c = checkOf(route.check);
      if (!c || c.score === null) break;
      out.push(`The check he means: ${route.check} · ${displayScore(c.score)} now · ${occasionLabel(c.occasion)}`);
      // What that photo shows, so a swap "instead of" a piece he wasn't wearing is answered from the truth (#310).
      const worn = c.itemIds.map((id) => pieces.find((p) => p.id === id)).filter((p): p is ClosetItemRow => !!p);
      if (worn.length) out.push(`On that photo he wore: ${worn.map(nameOf).join(' + ')}`);
      const fixes = c.fixes.filter((f, i, all) => all.findIndex((g) => g.copy === f.copy) === i);
      fixes.forEach((f) => out.push(`If he does "${oneLine(f.copy, 120)}": ${displayScore(f.to)} (the app's fix, on that photo)`));
      // A swap of a piece he named into that photo's reading, re-scored by the parts engine.
      const reading = await deps.readingOf(c.readingId);
      for (const h of route.pieces) {
        const it = named(h);
        if (!reading || !it || c.itemIds.includes(it.id)) continue;
        const cat = String(it.garment.category);
        const i = reading.garments.findIndex((g) => g.category === cat);
        if (i < 0) continue;
        const next: Reading = { ...reading, garments: reading.garments.map((g, j) => (j === i ? { ...it.garment } : g)) };
        const opts = scoreOptions({ occasion: c.occasion, styles: styles ?? [], boldness: null, secondLook: null });
        const swapped = overallFor(next, opts);
        if (swapped !== null) out.push(`If he wears ${nameOf(it)} instead: ${displayScore(swapped)} (the app's scoring, on that photo)`);
      }
      if (fixes.length === 0 && out.length === 1) out.push('No fix on that check raises it.');
      break;
    }
    case 'goesWith': {
      const pin = route.pieces.map(named).find((c) => !!c);
      if (!pin) break;
      out.push(`Outfits with ${nameOf(pin)}, from his closet:`);
      const seen = new Set<string>();
      for (const [label, occ] of [['Best', route.occasion ?? 'everyday'], ['Dressier', 'date'], ['More relaxed', 'class']] as const) {
        const o = outfitLine(label, occ, pin.id, undefined, label === 'Best');
        if (o && !seen.has(o[1]!)) {
          seen.add(o[1]!);
          out.push(`- ${o[0]}`);
        }
      }
      if (seen.size === 0) out.push('- None yet: his closet is missing a top, bottoms or shoes that work with it.');
      break;
    }
    case 'whatToWear': {
      // No occasion named: the one today's card is planned for, so the two agree (#358).
      const occ = route.occasion ?? cardOccasion ?? 'everyday';
      const o = outfitLine('Pick', occ, undefined, undefined, true);
      // Another means another top (the ids start with the layer when there is one).
      const top = o ? pieces.find((c) => c.slot === 'top' && o[1]!.split('+').includes(c.id)) : undefined;
      const other = o ? outfitLine('Another', occ, undefined, new Set(top ? [top.id] : [])) : null;
      if (o) out.push(`Outfits from his closet for ${lower(occasionLabel(occ))}:`, `- ${o[0]}`, ...(other && other[1] !== o[1] ? [`- ${other[0]}`] : []));
      else out.push('His closet can\'t make a full outfit yet (a top, bottoms and shoes).');
      const w = todaysWeather(s);
      if (w) out.push(`Weather today: ${Math.round(w.nowF)}° now, ${Math.round(w.highF)}° high`);
      break;
    }
    case 'canIWear': {
      for (const h of route.pieces) {
        const it = named(h);
        if (!it) continue;
        const g = it.garment;
        const facts = [it.slot, typeof g.subcategory === 'string' ? g.subcategory.replace(/_/g, ' ') : null, typeof g.color_family === 'string' ? g.color_family : null,
          typeof g.leg_shape === 'string' && g.leg_shape !== 'na' ? `${g.leg_shape} leg` : null].filter(Boolean).join(', ');
        out.push(`${nameOf(it)}: ${facts}`);
      }
      if (route.occasion) out.push(`Occasion: ${lower(occasionLabel(route.occasion))}`);
      // The pieces he named, judged by the same rules a fit check uses (J1).
      const items = route.pieces.map(named).filter((c): c is ClosetItemRow => !!c);
      const j = judgeOutfit(items, route.occasion ?? 'everyday', styles);
      if (j) {
        out.push(...judgementLines(j));
        verdict = j.verdict;
      }
      break;
    }
    case 'shape': {
      const items = route.pieces.map(named).filter((c): c is ClosetItemRow => !!c);
      // How a piece sits on him only shows in a photo (#310): say so rather than guess.
      out.push('How a piece fits him (baggy, long, tight) only shows in a fit check photo: don\'t claim it, offer a fit check.');
      if (items.length === 0) break;
      out.push(`The pieces he means: ${items.map(nameOf).join(' + ')}`);
      const j = judgeOutfit(items, route.occasion ?? 'everyday', styles);
      if (j) out.push(...judgementLines(j));
      break;
    }
    case 'buyNext': {
      const own = ownership(s.closet, deps.starterMarks);
      const budget = asBudget(s.profile?.budget ?? null);
      const cap = budget === 'under_30' ? 30 : budget === '30_60' ? 60 : budget === '60_100' ? 100 : Infinity;
      // "+N" is the Closet's count (#309); the Closet's ranking: most outfits first, ties in Starter order (a stable sort).
      const rows = starterList(styles).filter((e) => !own[e.id]?.owned && e.pick && e.slot && !avoidsPhrase(e.pick.phrase, s.facts)).map((e) => {
        const gain = starterGain(s.closet, styles, e);
        const low = Number(/\$(\d+)/.exec(e.budget)?.[1] ?? NaN);
        return { e, gain, over: low > cap };
      }).sort((a, b) => b.gain - a.gain);
      if (rows.length === 0) out.push('He owns every Starter basic.');
      else out.push('What he could buy next (the Starter basics he doesn\'t own; "+N" is outfits it adds with what he owns):');
      for (const r of rows.slice(0, 5)) {
        out.push(`- ${r.e.id} ${lower(r.e.pick!.phrase)} · +${r.gain} outfits · ${r.e.budget} budget, ${r.e.mid} mid${r.over ? ' · over his budget' : ''}`);
      }
      break;
    }
    default:
      break;
  }
  return { text: out.join('\n'), kind: route.kind, ...(verdict ? { verdict } : {}) };
}

/** Every score the model may say: the pack's and the evidence's (gate.ts). */
export function allowedScores(pack: string, evidence: string): Set<string> {
  return new Set([...scoresIn(pack), ...scoresIn(evidence)]);
}

// ---------------------------------------------------------------- T105 (tasks/T105/IMPLEMENTATION.md)
const SLOT_WORD: Record<string, string> = { top: 'tops', bottom: 'bottoms', shoes: 'shoes', outer: 'outerwear', accessory: 'accessories' };
const CATEGORY_SLOT: Record<string, string> = { top: 'top', bottom: 'bottom', footwear: 'shoes', outerwear: 'outer', accessory: 'accessory' };
const SLOT_CATEGORY: Record<string, string> = { top: 'top', bottom: 'bottom', shoes: 'footwear', outer: 'outerwear', accessory: 'accessory' };

/** Lines for the cards Kit showed today, oldest first, the newest 8 (KC6.3). Names are his pieces' names now. */
export function shownCardLines(s: StylistSnapshot): string[] {
  const today = dayKey(s.nowMs, s.zone);
  const nameOf = (id: string): string | null => {
    const c = s.closet.find((x) => x.id === id);
    return c && isOwned(c) && !c.isDeleted ? c.name : null;
  };
  const lines: string[] = [];
  const rows = s.chat
    .filter((m) => m.role === 'stylist' && dayKey(m.createdAt, s.zone) === today)
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  for (const m of rows) {
    const c = storedCard(m.payload?.askCard);
    if (!c) continue;
    const line = cardLine(c, nameOf);
    if (line) lines.push(oneLine(line, 200));
  }
  return lines.slice(-8);
}

function cardLine(c: AskCard, nameOf: (id: string) => string | null): string | null {
  switch (c.type) {
    case 'outfit': {
      const occ = lower(occasionLabel(c.occasion));
      const needs = (c.needs ?? []).map((p) => p.name);
      if (c.example) return `- Example outfit for ${occ} (none of it his): ${needs.join(', ')}`;
      const his = c.itemIds.map(nameOf).filter((n): n is string => !!n);
      return `- Outfit for ${occ}: ${his.join(', ')}${needs.length ? `; he'd need: ${needs.join(', ')}` : ''}`;
    }
    case 'options': {
      const parts = c.options.map((e) => {
        if ('piece' in e) return `${e.piece.name} (he'd need)`;
        const n = nameOf(e.itemId);
        return n ? `${n} (his)` : null;
      }).filter((x): x is string => !!x);
      return `- Options for ${SLOT_WORD[c.slot] ?? c.slot}: ${parts.join(', ')}`;
    }
    case 'colors': {
      const names = c.families.map((f) => colorName(f)).filter((n): n is string => !!n).join(', ');
      if (c.about === 'piece') return `- Colors for the ${kindNoun(c.kind)}: ${names}`;
      const goes = colorName(c.goesWith);
      return `- Colors that go with ${goes ? lower(goes) : c.goesWith}: ${names}`;
    }
    case 'buy': {
      const row = catalogRow(c.starterId);
      if (!row) return null;
      return `- Next buy: ${lower(row.pick?.name ?? row.name)}`;
    }
    case 'add':
      return `- Add card: ${c.piece.name} (${c.outcome === 'asked' ? 'asked' : c.outcome === 'added' ? 'added to his closet' : 'he said no thanks'})`;
    case 'changed':
      return `- Changed piece: ${c.after.name} (${c.undone ? 'change undone' : `was ${c.before.name}`})`;
    default:
      return null;
  }
}

// ---------------------------------------------------------------- the allowed colors as evidence (KC3.3, KC3.5)
export interface ColorEvidence {
  /** The <evidence> lines. */
  text: string;
  /** Families Kit may name; null = no list (the sentence rule is off). */
  allowed: ReadonlySet<string> | null;
  /** Families of his owned pieces plus colors named in his question. */
  own: ReadonlySet<string>;
}

const COLOR_QUESTION = /\b(?:colou?rs?|shades?)\b/i;
const GOES_WITH = /\b(?:go|goes|pair|pairs|work|works|match|matches)\s+with\s+(?:(?:a|an|some|the)\s+)?([a-z-]+(?:\s+[a-z-]+)?)/i;
const GARMENT_WORD = /\b(?:jeans|chinos?|trousers|pants|cargos?|joggers|shorts|tees?|t-shirts?|shirts?|oxfords?|sweaters?|sweatshirts?|hoodies?|cardigans?|polos?|overshirts?|jackets?|coats?|blazers?|bombers?|sneakers|runners|loafers|boots|shoes|belts?|watch(?:es)?|caps?|beanies?|tops?|bottoms?|pieces?|outfits?)\b/i;
const COLORING_WORD = /\b(?:skin|hair|eyes?|complexion|undertones?)\b/i;
const ACCESSORY_WORD = /\b(?:belts?|watch(?:es)?|caps?|beanies?|hats?)\b/i;

/** A question about colors: the word "color", "colour" or "shade", or "what goes with olive?" (a color and no piece). */
export const isColorQuestion = (question: string): boolean => {
  if (COLOR_QUESTION.test(question)) return true;
  const m = GOES_WITH.exec(question);
  if (!m) return false;
  const phrase = m[1]!.trim();
  if (/^(?:my|your|his|our|that|this|these|those)\b/i.test(phrase)) return false;
  return colorsNamed(phrase.split(/\s+/).slice(0, 2).join(' ')).length > 0 && !GARMENT_WORD.test(phrase);
};

/** A color question about his looks: skin, hair, eyes, complexion or undertone next to a color. */
export const mentionsColoring = (question: string): boolean => COLORING_WORD.test(question) && (isColorQuestion(question) || colorsNamed(question).length > 0);

const paletteOrder = (families: Iterable<string>): string[] => {
  const set = new Set(families);
  return COLOR_CHOICES.filter((f) => set.has(f));
};
const namesOf = (families: Iterable<string>): string => paletteOrder(families).map((f) => colorName(f) ?? f).join(', ');

interface Target {
  /** What the list is for, in words. */
  words: string;
  piece: Garment | null;
  /** His row when the target is one of his pieces. */
  row: ClosetItemRow | null;
  /** A named color (the general case). */
  named: string | null;
}

interface Source { handles: readonly string[]; kindWords: string | null; colorWords: string | null }

function targetOf(src: Source, s: StylistSnapshot, ctx: Pick<StylistContext, 'handles'>): Target | null {
  const row = src.handles[0] ? s.closet.find((c) => c.id === ctx.handles[src.handles[0]!] && isOwned(c) && !c.isDeleted) ?? null : null;
  if (row) return String(row.slot) === 'accessory' || String(row.garment.category) === 'accessory' ? null : { words: row.name, piece: row.garment, row, named: null };
  if (src.kindWords) {
    if (ACCESSORY_WORD.test(src.kindWords)) return null;
    const g = garmentOf(src.kindWords);
    if (g) return { words: `the ${kindNoun(String(g.subcategory))}`, piece: g, row: null, named: null };
  }
  if (src.colorWords) {
    const named = colorsNamed(src.colorWords)[0];
    if (named) return { words: `what goes with ${colorName(named) ?? named}`, piece: null, row: null, named };
  }
  return null;
}

/** The pieces of the outfit around the target: the newest outfit card shown today that holds it, else today's newest scored check. */
function contextOutfit(tg: Target, s: StylistSnapshot): { others: Garment[]; occasion?: string } {
  const today = dayKey(s.nowMs, s.zone);
  const slot = tg.row ? String(tg.row.slot) : CATEGORY_SLOT[String(tg.piece?.category)] ?? '';
  const live = (id: string) => s.closet.find((c) => c.id === id && isOwned(c) && !c.isDeleted) ?? null;
  type Entry = { id: string | null; slot: string; garment: Garment };
  const entriesOf = (c: Extract<AskCard, { type: 'outfit' }>): Entry[] => {
    const out: Entry[] = [];
    for (const id of c.itemIds) {
      const r = live(id);
      if (r) out.push({ id: r.id, slot: String(r.slot), garment: r.garment });
    }
    for (const p of c.needs ?? []) {
      const sl = slotOfKind(p.kind);
      if (sl) out.push({ id: null, slot: sl, garment: G(SLOT_CATEGORY[sl] ?? sl, p.kind, p.color) });
    }
    return out;
  };
  const cards = s.chat
    .filter((m) => m.role === 'stylist' && dayKey(m.createdAt, s.zone) === today)
    .sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id))
    .map((m) => storedCard(m.payload?.askCard))
    .filter((c): c is Extract<AskCard, { type: 'outfit' }> => !!c && c.type === 'outfit' && !c.example);
  for (const c of cards) {
    const entries = entriesOf(c);
    const holds = tg.row ? entries.some((e) => e.id === tg.row!.id) : entries.some((e) => e.slot === slot);
    if (holds) return { others: entries.filter((e) => e.slot !== slot && e.id !== tg.row?.id).map((e) => e.garment) };
  }
  const check = [...s.checks]
    .filter((c) => c.dayKey === today && c.status === 'scored')
    .sort((a, b) => b.createdAt - a.createdAt)[0];
  if (check) {
    const others = check.itemIds.map(live).filter((r): r is ClosetItemRow => !!r && String(r.slot) !== slot && r.id !== tg.row?.id).map((r) => r.garment);
    if (others.length) return { others, occasion: check.occasion };
  }
  return { others: [] };
}

type ColorsFn = NonNullable<EvidenceDeps['allowedColors']>;

/** The list for a target: one call, or two for a named color (the union of both pairings, D8). A throw is an empty list. */
function listFor(tg: Target, s: StylistSnapshot, extraRoute: readonly Garment[], fn: ColorsFn): ColorFamily[] {
  const safe = (input: AllowedColorsInput): ColorFamily[] => {
    try {
      return fn(input);
    } catch {
      return [];
    }
  };
  if (tg.named) {
    const asTee = safe({ others: [G('top', 'tee', tg.named)], piece: G('bottom', 'jeans', 'unknown') });
    const asJeans = safe({ others: [G('bottom', 'jeans', tg.named)], piece: G('top', 'tee', 'unknown') });
    return paletteOrder([...asTee, ...asJeans]) as ColorFamily[];
  }
  const around = contextOutfit(tg, s);
  const input: AllowedColorsInput = { others: [...around.others, ...extraRoute], piece: tg.piece!, ...(around.occasion ? { occasion: around.occasion } : {}) };
  return safe(input);
}

function extraPieces(handles: readonly string[], s: StylistSnapshot, ctx: Pick<StylistContext, 'handles'>, tg: Target): Garment[] {
  return handles.slice(1)
    .map((h) => s.closet.find((c) => c.id === ctx.handles[h] && isOwned(c) && !c.isDeleted))
    .filter((r): r is ClosetItemRow => !!r && r.id !== tg.row?.id && String(r.slot) !== (tg.row ? String(tg.row.slot) : ''))
    .map((r) => r.garment);
}

/**
 * KC3.3: the colors the rules would not mark down, as evidence for a color question (null when it isn't one, or
 * there is no piece, kind or color to ask about). KC3.5 adds the fixed line when he asks about his looks.
 */
export function colorEvidence(question: string, route: Route, s: StylistSnapshot, ctx: Pick<StylistContext, 'handles'>, deps: Pick<EvidenceDeps, 'allowedColors'> = {}): ColorEvidence | null {
  const coloring = mentionsColoring(question);
  if (!isColorQuestion(question) && !coloring) return null;
  const fn: ColorsFn = deps.allowedColors ?? allowedColors;
  const owned = s.closet.filter((c) => isOwned(c) && !c.isDeleted && !c.mergedInto);
  const ownFamilies = owned.map((c) => String(c.garment.color_family ?? '')).filter((f) => (COLOR_CHOICES as readonly string[]).includes(f));
  const own = new Set<string>([...ownFamilies, ...colorsNamed(question)]);
  const target = targetOf({ handles: route.pieces, kindWords: question, colorWords: question }, s, ctx);
  const lines: string[] = [];
  let allowed: ReadonlySet<string> | null = null;
  if (target) {
    const list = listFor(target, s, extraPieces(route.pieces, s, ctx, target), fn);
    allowed = new Set(list);
    if (list.length === 0) lines.push(`Allowed colors for ${target.words}: not available; name only the colors of his own pieces`);
    else if (list.length >= COLOR_CHOICES.length) lines.push(`Allowed colors for ${target.words}: any of the ${COLOR_CHOICES.length} colors (nothing in the outfit limits it)`);
    else lines.push(`Allowed colors for ${target.words} (the rules would not mark these down in this outfit; name only these and the colors of his own pieces): ${namesOf(list)}`);
  } else if (!coloring) {
    return null;
  } else {
    lines.push('No piece, kind or color is named, so there is no allowed-colors list for this question.');
  }
  if (coloring) {
    lines.push(`He asked about colors for his looks. Start with "${t('ask.refuseFace')}" then name only colors that go with his own pieces: ${namesOf(ownFamilies)}`);
  }
  return { text: lines.join('\n'), allowed, own };
}

/**
 * KC3.3's card rule: the list for a model `colors` block, whatever the question's wording was. Any other card, or one
 * with nothing to ask about, is null.
 */
export function allowedForCard(raw: unknown, s: StylistSnapshot, ctx: Pick<StylistContext, 'handles'>, deps: Pick<EvidenceDeps, 'allowedColors'> = {}): ReadonlySet<string> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.type !== 'colors') return null;
  const piece = typeof o.piece === 'string' ? o.piece : null;
  const handle = piece && /^P\d+$/.test(piece) ? piece : null;
  const src: Source = {
    handles: handle ? [handle] : [],
    kindWords: piece && !handle ? piece : null,
    colorWords: typeof o.goesWith === 'string' ? o.goesWith : null,
  };
  const target = targetOf(src, s, ctx);
  if (!target) return null;
  return new Set(listFor(target, s, [], deps.allowedColors ?? allowedColors));
}
