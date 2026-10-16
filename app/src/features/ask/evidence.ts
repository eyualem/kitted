// The evidence for one question (07 §5.1, check R2): computed by code on the phone, only what the router's kind
// needs. Every number in it is one the code computed (a check's stored score and fix targets, the parts engine on a
// swap, "+N outfits" from rotation); the sentence gate lets the model say only those (gate.ts allowedScores).
// Outfits never carry a predicted score (R5). Pieces mentioned in chat (source 'chat') are used in outfits but never
// in a "+N outfits" count (07 §4).
import {
  dayKey, localParts, pickOutfit, seasonNeeds, weatherNeeds, type ClosetItem, type DayWeather, type Reading,
} from '@kitted/core';
import { OCCASIONS, type CardOccasion, type ClosetItemRow, type FitCheckRow, type OccasionKey } from '@/data/types';
import { displayScore } from '@/design-system/score';
import { isAwaitingAnswer, isOwned } from '@/features/closet/profile';
import { overallFor, scoreOptions } from '@/features/fitcheck/scoring';
import { starterGain } from '@/features/finish/gains';
import { ownership, STARTER } from '@/features/finish/starter';
import { whyLine } from '@/features/morning/copy';
import { occasionLabel } from '@/features/stylist/thread';
import { asBudget } from '@/features/you/profile';
import { fullCheckLines, oneLine, type StylistContext, type StylistSnapshot } from './context';
import { avoidedIds, avoidsPhrase, judgeOutfit, judgementLines } from './judge';
import { scoresIn } from './gate';
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

  /** One outfit line from the picker: its pieces by handle and its reasons (no predicted score). */
  const outfitLine = (label: string, occasion: OccasionKey, pin?: string, exclude?: Set<string>): string[] | null => {
    const month = localParts(s.nowMs, s.zone).m;
    const w = todaysWeather(s);
    const r = pickOutfit({
      closet: pieces as unknown as ClosetItem[], occasion, styles, needs: w ? weatherNeeds(w) : seasonNeeds(month),
      seed: `${dayKey(s.nowMs, s.zone)}|ask|${label}|${pin ?? ''}`, ...(pin ? { pin } : {}),
      ...(exclude || avoided.size ? { exclude: new Set([...(exclude ?? []), ...[...avoided].filter((id) => id !== pin)]) } : {}),
    });
    // A pinned piece the picker couldn't fit in is no answer to "what goes with it".
    if (!r.outfit || (pin && !r.outfit.itemIds.includes(pin))) return null;
    const items = r.outfit.itemIds.map((id) => pieces.find((c) => c.id === id)).filter((c): c is ClosetItemRow => !!c);
    const card: CardOccasion = occasion === 'gym' || occasion === 'home' ? 'everyday' : occasion;
    const why = oneLine(whyLine(r.outfit.reasons, items, card), 160);
    // The rules' own words on the same outfit (J2): a problem they'd find is said, never hidden.
    const j = judgeOutfit(items, occasion, styles);
    const careful = j?.problems.length ? ` · careful: ${oneLine(j.problems[0], 140)}` : '';
    return [`${label} (${lower(occasionLabel(occasion))}): ${items.map(nameOf).join(' + ')}${why ? ` · why: ${why}` : ''}${careful}`, r.outfit.itemIds.join('+')];
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
        const o = outfitLine(label, occ, pin.id);
        if (o && !seen.has(o[1]!)) {
          seen.add(o[1]!);
          out.push(`- ${o[0]}`);
        }
      }
      if (seen.size === 0) out.push('- None yet: his closet is missing a top, bottoms or shoes that work with it.');
      break;
    }
    case 'whatToWear': {
      const occ = route.occasion ?? 'everyday';
      const o = outfitLine('Pick', occ);
      const other = o ? outfitLine('Another', occ, undefined, new Set(o[1]!.split('+').slice(0, 1))) : null;
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
      const rows = STARTER.filter((e) => !own[e.id]?.owned && e.pick && e.slot && !avoidsPhrase(e.pick.phrase, s.facts)).map((e) => {
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
