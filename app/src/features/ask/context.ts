// What the stylist knows when he asks (07 §3): the per-question part of the prompt, built fresh for every question
// by one pure function from a plain snapshot (snapshot.ts reads it from the store). Clothes and choices only.
//   Sent: today's date and season · his picked looks in order (+ his "Something else" words) · fit preference ·
//   height and build when he gave them (used for sizing and cut, never said back: 07 §7.1, #267) · budget · the live
//   facts (guesses marked) · his closet, one line per owned piece (≤80, most worn first, "Same as…?" pieces left
//   out) · today's checks in full · the last 7 days short · today's idea and its weather as words · today's chat
//   (last 10 turns) · the question.
//   Never: birth year or age, his name, units, location, any photo or file path, a raw reading, deleted facts,
//   removed pieces, earlier days' chat (07 §3.2). The snapshot type doesn't even carry most of them.
// Everything he or a reading could have typed (piece names, facts, chat) goes through `oneLine`: one line, no
// control characters, capped, so a piece renamed "Ignore your rules…" stays data on its own line (07 §7.4).
// Pieces and checks get short handles (P1…, FC1…) the model names in its card; `handles` maps them back to ids.
import { dayKey, localParts, PARTS_DATA, type DayWeather, type PartName, type Styles, type ZoneOffset } from '@kitted/core';
import type { ChatMessage, ClosetItemRow, DailyIdeaRow, FactRow, FitCheckRow, OutfitRow } from '@/data/types';
import { displayScore, scoreWordLabel } from '@/design-system/score';
import { isAwaitingAnswer, isOwned } from '@/features/closet/profile';
import { colorWord } from '@/features/fitcheck/labels';
import { picksOf } from '@/features/fitcheck/goingFor';
import { cardOccasionLabel, stripLines, styleLabel } from '@/features/morning/copy';
import { FITS, fitLabel, heightLabel, type FitPref } from '@/features/onboarding/basics';
import { occasionLabel } from '@/features/stylist/thread';
import { liveFacts } from '@/features/you/facts';
import { asBudget, budgetLabel, heightInOf } from '@/features/you/profile';
import { t } from '@/i18n/en';
import { clockTime, signed, weekdayName } from '@/i18n/format';

/** The profile fields the stylist may use. No birth year, no name, no units, no consent state. */
export interface SnapshotProfile {
  styles: Styles;
  fitPreference: string;
  heightCm: number | null;
  build: string;
  budget: string | null;
}

export interface StylistSnapshot {
  nowMs: number;
  zone: ZoneOffset;
  profile: SnapshotProfile | null;
  /** His "Something else" words from setup (kv onboarding.otherStyle). */
  otherStyle: string | null;
  facts: readonly FactRow[];
  closet: readonly ClosetItemRow[];
  /** All of it; only today's is used. */
  chat: readonly ChatMessage[];
  checks: readonly FitCheckRow[];
  ideas: readonly DailyIdeaRow[];
  outfits: readonly OutfitRow[];
}

export interface StylistContext {
  text: string;
  /** "P7" → closet id, "FC1" → fit check id. */
  handles: Record<string, string>;
  meta: { pieces: number; checksToday: number; tokensApprox: number };
}

export const MAX_PIECES = 80;
export const MAX_TURNS = 10;
const RECENT_DAYS = 7;
const MAX_RECENT_CHECKS = 14;
const DAY_MS = 24 * 3_600_000;

/** One line of data: control characters and line breaks become spaces, bidi and zero-width marks go, capped. */
export function oneLine(s: string | null | undefined, max = 120): string {
  const clean = String(s ?? '')
    // C0/C1 controls (incl. \n \r \t), line and paragraph separators, zero-width and bidi controls.
    .replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029\u200b-\u200f\u202a-\u202e\u2060-\u2064\u2066-\u2069\ufeff]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** The cut of a top from the reading's volume (1 fitted … 5 very oversized). */
const VOLUME_WORD: Record<number, string> = { 1: 'fitted', 2: 'trim', 3: 'regular', 4: 'roomy', 5: 'oversized' };

/** Build words that are his answer (the onboarding list and #247's); anything else, "Rather not say" included, is left out. */
const BUILD_WORDS: readonly string[] = ['slim', 'average', 'athletic', 'broad', 'bigger'];

function seasonOf(month: number): string {
  if (month === 12 || month <= 2) return 'winter';
  if (month <= 5) return 'spring';
  if (month <= 8) return 'summer';
  return 'fall';
}

function timeText(ms: number, zone: ZoneOffset): string {
  return `${clockTime(ms, zone)} ${localParts(ms, zone).hh < 12 ? t('fmt.am') : t('fmt.pm')}`;
}

function shortDay(ms: number, zone: ZoneOffset): string {
  const p = localParts(ms, zone);
  return `${t('fmt.months').split(',')[p.m - 1] ?? ''} ${p.d}`;
}

function pieceLine(handle: string, c: ClosetItemRow): string {
  const g = c.garment ?? {};
  const bits = [handle, oneLine(c.name, 60), String(c.slot)];
  const color = colorWord(g);
  if (color) bits.push(lower(color));
  const leg = typeof g.leg_shape === 'string' && g.leg_shape !== 'na' ? `${g.leg_shape.replace(/_/g, ' ')} leg` : null;
  const cut = c.slot === 'bottom' ? leg : c.slot === 'top' || c.slot === 'outer' ? VOLUME_WORD[Number(g.volume)] ?? null : null;
  if (cut) bits.push(cut);
  bits.push(`worn ${c.wornCount ?? 0}×`);
  if (!c.isPhotographed) bits.push('no photo yet');
  return bits.join(' · ');
}

function weatherWords(w: Record<string, unknown> | null, nowMs: number, zone: ZoneOffset): string | null {
  if (!w || typeof w.nowF !== 'number' || typeof w.highF !== 'number') return null;
  const { main, rain } = stripLines(w as unknown as DayWeather, localParts(nowMs, zone).hh);
  return `${main}, ${lower(rain)}`;
}

/** A check in full, as the card and the Why sheet say it (the pack's "today" block, and explain's evidence). */
export function fullCheckLines(
  c: FitCheckRow, zone: ZoneOffset, checkHandle: ReadonlyMap<string, string>, piecesOf: (c: FitCheckRow) => string[],
): string[] {
  const out: string[] = [];
  const score = c.score!;
  const head = [checkHandle.get(c.id)!, timeText(c.createdAt, zone), `${displayScore(score)} ${scoreWordLabel(score)}`, occasionLabel(c.occasion)];
  if (c.parentId && checkHandle.get(c.parentId)) head.push(`re-check of ${checkHandle.get(c.parentId)}`);
  if (c.details.readsAs) head.push(`reads as ${lower(styleLabel(c.details.readsAs))}`);
  const gf = c.details.goingFor;
  if (gf?.style) head.push(`going for ${lower(styleLabel(gf.style))}`);
  else if (gf?.other) head.push(`going for "${oneLine(gf.other, 80)}"`);
  out.push(head.join(' · '));
  if (c.explanation) out.push(`  Summary: ${oneLine(c.explanation, 300)}`);
  if (c.isPartial) out.push(`  Partial check: ${c.notRated.includes('bottom half') ? 'only the top half was in the photo' : 'shoes not in the photo'} (what isn't in the photo never costs points)`);
  const worn = piecesOf(c);
  if (worn.length) out.push(`  Pieces: ${worn.join(', ')}`);
  const parts = c.details.parts;
  if (parts) {
    const names = PARTS_DATA.partNames as Record<PartName, string>;
    const shown = (PARTS_DATA.partOrder as readonly PartName[]).map((k) => {
      const part = parts.parts[k];
      if (!part || part.display === null) return `${names[k]} not scored`;
      const why = part.reasons.map((r) => `${oneLine(r.line, 120)} ${signed(Math.round(r.points * 100) / 100)}`).join('; ');
      return `${names[k]} ${part.display}${why ? ` (${why})` : ''}`;
    });
    out.push(`  Parts: ${shown.join(' · ')}`);
    if (parts.condition.deduction > 0) out.push(`  Condition: ${oneLine(parts.condition.display, 120)} −${parts.condition.deduction}`);
  }
  const fixes = c.fixes.filter((f, i, all) => all.findIndex((g) => g.copy === f.copy) === i);
  fixes.forEach((f, i) => out.push(`  Fix ${i + 1}: ${oneLine(f.copy, 120)} → ${displayScore(f.to)}${f.raisesLine ? ` (${oneLine(f.raisesLine, 80)})` : ''}`));
  if (!fixes.length) out.push('  Fixes: none on the card');
  const tip = c.details.nextLevel?.[0];
  if (tip) out.push(`  ${c.details.tipLead === 'smallerStep' ? 'Smaller step' : c.details.tipLead === 'tip' ? 'Tip' : 'Next level'}: ${oneLine(tip, 160)}`);
  return out;
}

export function buildStylistContext(s: StylistSnapshot, question: string): StylistContext {
  const { zone, nowMs } = s;
  const today = dayKey(nowMs, zone);
  const handles: Record<string, string> = {};
  const lines: string[] = [];
  const push = (...l: string[]) => lines.push(...l);

  // When and who (no age, no name: 07 §3.2).
  const p = localParts(nowMs, zone);
  push(`Today: ${weekdayName(p.dow)}, ${shortDay(nowMs, zone)}, ${seasonOf(p.m)}`);
  const prof = s.profile;
  if (prof) {
    const picks = picksOf(prof.styles);
    if (picks.length) push(`Looks he picked: ${picks.map((k, i) => `${lower(styleLabel(k))}${i === 0 && picks.length > 1 ? ' (1st)' : ''}`).join(', ')}`);
    const other = oneLine(s.otherStyle, 80);
    if (other) push(`His own words for a look: "${other}"`);
    if ((FITS as readonly string[]).includes(prof.fitPreference)) push(`Prefers a ${lower(fitLabel(prof.fitPreference as FitPref))} fit`);
    const h = heightInOf(prof.heightCm);
    if (h !== null) push(`Height: ${heightLabel(h)} (for lengths and sizing; never say it back)`);
    if (BUILD_WORDS.includes(prof.build)) push(`Build: ${prof.build} (for sizing and cut; never say it back)`);
    const budget = asBudget(prof.budget);
    if (budget && budget !== 'prefer_not') push(`Budget: ${budgetLabel(budget)} a piece`);
  }

  // What the stylist knows (the facts he can see in You), guesses marked.
  const facts = liveFacts(s.facts);
  if (facts.length) {
    push('', 'What you know about him (he can see and delete these):');
    for (const f of facts) push(`- ${f.source === 'guess' ? '(a guess, not confirmed) ' : ''}${oneLine(f.value)}`);
  }

  // His closet: owned, not waiting on "Same as…?", most worn first.
  const owned = s.closet.filter(isOwned);
  const pieces = owned
    .filter((c) => !isAwaitingAnswer(c, owned))
    .sort((a, b) => (b.wornCount ?? 0) - (a.wornCount ?? 0) || (b.lastWornAt ?? 0) - (a.lastWornAt ?? 0) || a.id.localeCompare(b.id))
    .slice(0, MAX_PIECES);
  const pieceHandle = new Map<string, string>();
  pieces.forEach((c, i) => {
    const h = `P${i + 1}`;
    handles[h] = c.id;
    pieceHandle.set(c.id, h);
  });
  push('', pieces.length ? `His closet (${pieces.length} ${pieces.length === 1 ? 'piece' : 'pieces'}, most worn first):` : 'His closet: empty so far.');
  pieces.forEach((c) => push(pieceLine(pieceHandle.get(c.id)!, c)));

  /** A check's pieces by handle (a piece folded into another goes by the one it became; removed ones are left out). */
  const piecesOf = (c: FitCheckRow): string[] => {
    const out: string[] = [];
    for (const id of c.itemIds ?? []) {
      const it = s.closet.find((x) => x.id === id);
      const target = it?.mergedInto ?? id;
      const h = pieceHandle.get(target);
      const piece = pieces.find((x) => x.id === target);
      if (h && piece && !out.includes(`${h} ${oneLine(piece.name, 60)}`)) out.push(`${h} ${oneLine(piece.name, 60)}`);
    }
    return out;
  };

  const scored = s.checks.filter((c) => c.status === 'scored' && c.score !== null).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  const todays = scored.filter((c) => c.dayKey === today);
  const recentDays = new Set(Array.from({ length: RECENT_DAYS }, (_, i) => dayKey(nowMs - (i + 1) * DAY_MS, zone)));
  const recent = scored.filter((c) => c.dayKey !== today && recentDays.has(c.dayKey)).reverse().slice(0, MAX_RECENT_CHECKS);
  let fc = 0;
  const checkHandle = new Map<string, string>();
  for (const c of [...todays, ...recent]) {
    const h = `FC${++fc}`;
    handles[h] = c.id;
    checkHandle.set(c.id, h);
  }

  // Today's checks in full: what the card and the Why sheet say.
  if (todays.length) {
    push('', "Today's fit checks (the app's scores; never change them):");
    for (const c of todays) push(...fullCheckLines(c, zone, checkHandle, piecesOf));
  } else {
    push('', 'No fit check today yet.');
  }

  // The last 7 days, one line each.
  if (recent.length) {
    push('', 'Earlier this week:');
    for (const c of recent) {
      const worn = piecesOf(c).map((x) => x.replace(/^P\d+ /, ''));
      // The weekday too: given only "Oct 20", models guessed it was a Monday (#311).
      push([checkHandle.get(c.id)!, `${weekdayName(localParts(c.createdAt, zone).dow)}, ${shortDay(c.createdAt, zone)}`, `${displayScore(c.score!)} ${scoreWordLabel(c.score!)}`, occasionLabel(c.occasion), ...(worn.length ? [worn.map(lower).join(', ')] : [])].join(' · '));
    }
  }

  // Today's outfit idea(s) and the weather as words (never where he is).
  const ideas = s.ideas.filter((i) => i.dayKey === today).sort((a, b) => (a.slot === b.slot ? 0 : a.slot === 'day' ? -1 : 1));
  let weather: string | null = null;
  for (const idea of ideas) {
    const outfit = idea.outfitId ? s.outfits.find((o) => o.id === idea.outfitId) : undefined;
    const worn = (outfit?.itemIds ?? []).map((id) => pieceHandle.get(id) && `${pieceHandle.get(id)} ${oneLine(pieces.find((x) => x.id === id)?.name, 60)}`).filter((x): x is string => !!x);
    const what = worn.length ? worn.join(', ') : 'no outfit (closet too thin)';
    push('', `Today's ${idea.slot === 'evening' ? 'evening ' : ''}outfit idea · ${cardOccasionLabel(idea.occasion)}${idea.style ? ` · ${lower(styleLabel(idea.style))}` : ''}${idea.state !== 'idea' ? ` · ${idea.state}` : ''}: ${what}`);
    if (outfit?.summary) push(`  Why: ${oneLine(outfit.summary, 200)}`);
    weather = weather ?? weatherWords(idea.weather, nowMs, zone);
  }
  if (weather) push(`Weather today: ${weather}`);

  // Today's chat only, the last 10 turns (the question itself goes last, below).
  const chat = s.chat
    .filter((m) => dayKey(m.createdAt, zone) === today)
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id))
    .flatMap((m): string[] => {
      if (m.kind === 'text' && m.text && !m.payload.aiNote) return [`${m.role === 'user' ? 'He' : 'You'}: ${oneLine(m.text, 400)}`];
      if (m.kind === 'photo' && m.role === 'user') return [`He: (sent a photo for a fit check${m.fitCheckId && checkHandle.get(m.fitCheckId) ? `, ${checkHandle.get(m.fitCheckId)}` : ''})`];
      return [];
    });
  const q = oneLine(question, 600);
  if (chat.length && chat[chat.length - 1] === `He: ${q}`) chat.pop();
  const turns = chat.slice(-MAX_TURNS);
  if (turns.length) push('', "Today's chat so far:", ...turns);

  push('', `His question: ${q}`);
  const text = lines.join('\n');
  return { text, handles, meta: { pieces: pieces.length, checksToday: todays.length, tokensApprox: Math.ceil(text.length / 4) } };
}
