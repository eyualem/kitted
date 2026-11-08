// The morning/evening card (02 "S1d", 05 §MC4, DECISIONS-LOG #58–62).
//
// Two moments a day: the first time Stylist is shown in a window, the stylist posts a card that opens with its own
// hello and the weather (#340; it used to post a greeting line above it). Day card 4 am–4:59 pm (plans today), evening card 5 pm–3:59 am (plans tonight).
// One per day key and slot, locked: the outfit doesn't change on later opens, so the card and
// the notification agree. Changing the occasion or style, or Swap one, re-picks on purpose.
//
// Rotation (Oct 14): each pick sees what came before its own card: the cards shown on the 14
// days before (and, for the evening card, that day's card) and what he wore. So the top moves
// on even when he ignores every card, the evening never repeats the day's top, and a re-pick of
// the same card sees the same history as its first pick.
//
// Whether the card is "checked" (collapsed with his score) is derived, not stored: any scored
// check in that day's window collapses it, whether it started from the card or the composer.
import {
  addDays, dayKey, daysBetween, defaultRubric, isScored, itemAllowed, localParts, outfitReading, outfitValid, pickHistory, pickOutfit, seasonNeeds,
  swapOptions as coreSwapOptions, weatherNeeds,
  type ClosetItem, type DayWeather, type IdeaResult, type PastUse, type PickHistory, type PickInput, type Styles, type SwapOption, type WeatherWindow,
  type ZoneOffset,
} from '@kitted/core';
import type { KittedStore } from '@/data/store';
import type {
  CardOccasion, ChatMessage, ClosetItemRow, DailyIdeaRow, FitCheckRow, IdeaSlot, OccasionKey, OutfitRow, StyleKey, WearLogRow,
} from '@/data/types';
import { normStyleKey, STYLES } from '@/data/types';
import { wornChecks } from '@/features/fitcheck/tryOn';
import { wearOverridden } from './woreOwn';
import type { Clock } from '@/services/clock';
import type { WeatherSource } from '@/services/weather';

export interface MorningDeps {
  store: KittedStore;
  clock: Clock;
  weather: WeatherSource;
  ids: (prefix: string) => string;
  /** Auto-posting off (demo screens that show a fixed story). */
  enabled?: () => boolean;
}

export const EVENING_FROM_HOUR = 17;
const ROLLOVER_HOUR = 4;
const WEATHER_TIMEOUT_MS = 2_000;
/** Live weather (NWS) needs a location fix and two requests; its own budget is 6 s. */
const LIVE_WEATHER_TIMEOUT_MS = 7_000;
const EVENING_IGNORE_LIMIT = 3;
/** How far back the picker looks (its rules reach 7 days). */
export const HISTORY_DAYS = 14;
const KV = {
  eveningIgnored: 'idea.evening.ignored',
  style: (slot: IdeaSlot) => `idea.style.${slot}`,
  /** He changed the card's occasion or style, or swapped a piece: a fresher forecast never re-picks it (#338). */
  touched: (id: string) => `idea.touched.${id}`,
  /** The pieces swapped away from this card, as JSON ids (09 §23 M1, #353): none comes back by swapping. */
  swapped: (id: string) => `idea.swapped.${id}`,
} as const;
/** A card's forecast older than this is fetched again when Stylist shows (#338: "46° now" all afternoon). */
export const WEATHER_STALE_MS = 45 * 60_000;

export const ideaId = (day: string, slot: IdeaSlot) => `${day}|${slot}`;

/** Which card a moment belongs to: 4 am–4:59 pm is the day card, the rest is that day's evening. */
export function slotAt(nowMs: number, zone: ZoneOffset): { day: string; slot: IdeaSlot } {
  const h = localParts(nowMs, zone).hh;
  return { day: dayKey(nowMs, zone), slot: h >= ROLLOVER_HOUR && h < EVENING_FROM_HOUR ? 'day' : 'evening' };
}

/** A check belongs to the card of its own day key and window. */
export function checkInSlot(check: Pick<FitCheckRow, 'dayKey' | 'createdAt'>, idea: Pick<DailyIdeaRow, 'dayKey' | 'slot'>, zone: ZoneOffset): boolean {
  const s = slotAt(check.createdAt, zone);
  return s.day === idea.dayKey && s.slot === idea.slot;
}

export function defaultOccasion(slot: IdeaSlot, nowMs: number, zone: ZoneOffset): CardOccasion {
  if (slot === 'evening') return 'going_out';
  const dow = localParts(nowMs, zone).dow;
  return dow === 0 || dow === 6 ? 'everyday' : 'class';
}

const isStyle = (s: unknown): s is StyleKey => typeof s === 'string' && (STYLES as readonly string[]).includes(s);
/** Old keys (preppy, old money, gorpcore) read as the V5 names (#85). */
const normStyle = (s: unknown): StyleKey | null => (isStyle(s) ? s : normStyleKey(s));

/** One style, never a blend (#61). */
export const styleInput = (style: StyleKey | null): Styles | null => (style ? [[style, 1]] : null);

/** The rubric occasion a card occasion is scored for. */
export const scoringOccasion = (o: CardOccasion): OccasionKey => (o === 'staying_in' ? 'home' : o);

/** The rows a pick's history is read from (the card's and Kit's, #358). */
export interface HistoryRows {
  ideas: readonly DailyIdeaRow[];
  wears: readonly WearLogRow[];
  checks: readonly FitCheckRow[];
  closet: readonly ClosetItemRow[];
  /** An outfit row's pieces ([] when it's gone). */
  itemsOf: (outfitId: string) => readonly string[];
}

/**
 * What came before a card: other cards shown (and still showing) and what he wore (Wear this,
 * fit checks), each with how many days ago. Only earlier days count, plus, for the evening card,
 * the same day's card and morning checks. The card's own outfit never counts. Kit's outfit ideas
 * read the same history, for the card of the moment he asks in, plus `extra` (his own earlier cards; #358).
 */
export function historyFor(
  row: Pick<DailyIdeaRow, 'id' | 'slot'> & { outfitId?: string | null }, rows: HistoryRows, zone: ZoneOffset, extra: readonly PastUse[] = [],
): PickHistory {
  const day = row.id.split('|')[0] ?? '';
  const from = addDays(day, -HISTORY_DAYS);
  const evening = row.slot === 'evening';
  const before = (d: string, sameDay: boolean) => d >= from && (d < day || (evening && sameDay && d === day));
  const uses: PastUse[] = [...extra];
  for (const r of rows.ideas) {
    if (r.id === row.id || !r.outfitId || !before(r.dayKey, r.slot === 'day')) continue;
    uses.push({ daysAgo: daysBetween(r.dayKey, day), itemIds: rows.itemsOf(r.outfitId) });
  }
  // Checks come from the fit-check rows below; the wear log adds what he wore from a card.
  for (const w of rows.wears) {
    if (!w.outfitId || w.outfitId === row.outfitId || !before(w.day, true)) continue;
    // Wear this, then a fit check in something else: the check is what he wore (#369).
    if (wearOverridden(w, rows.itemsOf(w.outfitId), rows.checks, rows.closet, (ms) => slotAt(ms, zone).slot)) continue;
    uses.push({ daysAgo: daysBetween(w.day, day), itemIds: rows.itemsOf(w.outfitId) });
  }
  // Only what he wore: a check followed by another within the hour was a try-on (#360).
  for (const c of wornChecks(rows.checks)) {
    if (!before(c.dayKey, slotAt(c.createdAt, zone).slot === 'day')) continue;
    uses.push({ daysAgo: daysBetween(c.dayKey, day), itemIds: c.itemIds });
  }
  return pickHistory(uses, rows.closet as unknown as ClosetItem[]);
}

export function createMorningService(deps: MorningDeps) {
  const { store, clock } = deps;
  const zone = clock.offset;

  async function forecast(window: WeatherWindow): Promise<DayWeather | null> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), deps.weather.kind === 'live' ? LIVE_WEATHER_TIMEOUT_MS : WEATHER_TIMEOUT_MS);
    });
    try {
      const w = await Promise.race([deps.weather.forecast(window).catch(() => null), timeout]);
      // When it was fetched, so the card can tell a stale "now" (#338).
      return w ? ({ ...w, fetchedAt: clock.nowMs() } as DayWeather) : null;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function closet(): Promise<ClosetItemRow[]> {
    return (await store.closet.all()).filter((c) => !c.isDeleted);
  }

  async function history(row: Pick<DailyIdeaRow, 'id' | 'slot'> & { outfitId?: string | null }): Promise<PickHistory> {
    const [ideas, wears, checks, outfits, closet] = await Promise.all([
      store.dailyIdeas.all(), store.wearLog.all(), store.fitChecks.all(), store.outfits.all(), store.closet.all(),
    ]);
    const items = new Map(outfits.map((o) => [o.id, o.itemIds]));
    return historyFor(row, { ideas, wears, checks, closet, itemsOf: (id) => items.get(id) ?? [] }, zone);
  }

  type PickRow = Pick<DailyIdeaRow, 'id' | 'slot' | 'occasion' | 'style' | 'weather'> & { outfitId?: string | null };
  async function pickInput(row: PickRow, extra: { exclude?: Set<string> } = {}): Promise<PickInput> {
    const p = await store.profile.get('me');
    const w = row.weather as unknown as DayWeather | null;
    const month = localParts(clock.nowMs(), zone).m;
    return {
      closet: (await closet()) as ClosetItem[],
      occasion: scoringOccasion(row.occasion),
      styles: styleInput(row.style),
      // The card's style menu picks among the outfits that read as it (#379).
      look: row.style,
      boldness: p?.boldness ?? 'a_little',
      needs: w ? weatherNeeds(w) : seasonNeeds(month),
      evening: row.slot === 'evening',
      history: await history(row),
      seed: row.id,
      exclude: extra.exclude,
    };
  }

  async function pick(row: PickRow, extra: { exclude?: Set<string> } = {}): Promise<IdeaResult> {
    return pickOutfit(await pickInput(row, extra));
  }

  /**
   * Saves the card's outfit with each piece's fingerprint as planned (`basis`, 09-ui-review §26, #365). `o` is only for a
   * re-plan after he corrected a piece: the piece the "Updated for your …" line names, and the outfit first planned.
   */
  async function saveOutfit(
    result: IdeaResult, occasion: CardOccasion, existing: string | null, o: { updatedFor?: string; origin?: string } = {},
  ): Promise<string | null> {
    if (!result.outfit) return null;
    const all = await store.closet.all();
    const items = all.filter((c) => !c.isDeleted);
    const names = result.outfit.itemIds.map((id) => items.find((c) => c.id === id)?.name ?? '').filter(Boolean);
    const row: OutfitRow = {
      id: existing ?? deps.ids('O'),
      itemIds: result.outfit.itemIds,
      occasion,
      title: null,
      summary: names.join(', '),
      details: {
        predictedScore: result.outfit.predicted, missing: result.outfit.missing, reasons: result.outfit.reasons,
        // After a re-plan the first outfit's pieces stay watched too, so undoing his edit brings that outfit back.
        basis: basisOf([...new Set([...result.outfit.itemIds, ...(o.origin ? o.origin.split('+') : [])])], all),
        ...(o.updatedFor ? { updatedFor: o.updatedFor } : {}), ...(o.origin ? { origin: o.origin } : {}),
      } as OutfitRow['details'],
      source: 'idea',
      isSaved: false,
      createdAt: clock.nowMs(),
    };
    await store.outfits.put(row);
    return row.id;
  }

  async function startingStyle(slot: IdeaSlot): Promise<StyleKey | null> {
    const remembered = normStyle(await store.getKv(KV.style(slot)));
    if (remembered) return remembered;
    const p = await store.profile.get('me');
    return normStyle(p?.styles?.[0]?.[0]);
  }

  /** A seeded "Morning. An easy one…" + idea card from before this feature becomes today's day card. */
  async function adoptLegacy(day: string, slot: IdeaSlot, messages: ChatMessage[]): Promise<ChatMessage | null> {
    if (slot !== 'day') return null;
    return messages.find((m) => m.kind === 'card' && m.cardType === 'outfitIdea' && m.outfitId && dayKey(m.createdAt, zone) === day) ?? null;
  }

  /**
   * Posts the card for this moment if there isn't one yet. Returns the idea id, or null when
   * nothing was posted (already there, evening cards turned off, or posting disabled).
   */
  async function ensureCard(nowMs: number = clock.nowMs()): Promise<string | null> {
    if (deps.enabled && !deps.enabled()) return null;
    const { day, slot } = slotAt(nowMs, zone);
    const id = ideaId(day, slot);
    if (await store.dailyIdeas.get(id)) return null;
    const p = await store.profile.get('me');
    // He declined fit checks in onboarding: S26 ("Turn on fit checks") owns the thread, not this card.
    if (p && p.onboardingDone && !p.consentVersion) return null;
    if (slot === 'evening') {
      const ignored = await eveningIgnoreCount(day);
      await store.setKv(KV.eveningIgnored, String(ignored));
      if (ignored >= EVENING_IGNORE_LIMIT) return null;
    }

    const occasion = defaultOccasion(slot, nowMs, zone);
    const style = await startingStyle(slot);
    const permission = await deps.weather.permission();
    const weather = permission === 'granted' ? await forecast(slot) : null;
    const base = { id, slot, occasion, style, weather: weather as unknown as Record<string, unknown> | null };
    const messages = await store.chat.all();
    const legacy = await adoptLegacy(day, slot, messages);
    const result = await pick(base);
    const outfitId = await saveOutfit(result, occasion, null);

    let cardMessageId: string;
    if (legacy) {
      cardMessageId = legacy.id;
      await store.chat.patch(legacy.id, { cardType: 'morning', outfitId, payload: { ...legacy.payload, ideaId: id } });
      // The seeded greeting before it is the card's own hello now (#340): marked, so the thread hides it.
      const before = messages.filter((m) => m.role === 'stylist' && m.kind === 'text' && m.createdAt <= legacy.createdAt).sort((a, b) => b.createdAt - a.createdAt)[0];
      if (before && dayKey(before.createdAt, zone) === day) await store.chat.patch(before.id, { payload: { ...before.payload, greeting: true } });
    } else {
      // No greeting line of its own (founder, Oct 18, #340): the card opens with the hello and the weather.
      cardMessageId = deps.ids('M');
      await store.chat.put({
        id: cardMessageId, createdAt: nowMs + 1, role: 'stylist', kind: 'card', text: null, cardType: 'morning', fitCheckId: null,
        outfitId, itemId: null, chips: [], payload: { ideaId: id },
      });
    }
    await store.dailyIdeas.put({ ...base, dayKey: day, outfitId, messageId: cardMessageId, state: 'idea', fitCheckId: null, createdAt: nowMs });
    return id;
  }

  /** How many evening cards in a row he left untouched (state still 'idea', no check that evening). */
  async function eveningIgnoreCount(today: string): Promise<number> {
    const evenings = (await store.dailyIdeas.all()).filter((r) => r.slot === 'evening' && r.dayKey < today).sort((a, b) => b.dayKey.localeCompare(a.dayKey));
    const checks = await store.fitChecks.all();
    let n = 0;
    for (const r of evenings) {
      const touched = r.state !== 'idea' || checks.some((c) => !c.parentId && c.status === 'scored' && checkInSlot(c, r, zone));
      if (touched) break;
      n++;
    }
    return n;
  }

  /** Occasion or style changed on the card: re-pick (a suggestion, so no confirm, #62). */
  async function change(id: string, patch: { occasion?: CardOccasion; style?: StyleKey | null }): Promise<{ samePick: boolean }> {
    const row = await store.dailyIdeas.get(id);
    if (!row) return { samePick: false };
    const next = { ...row, ...patch };
    if (patch.style !== undefined) await store.setKv(KV.style(row.slot), patch.style ?? '');
    if (next.occasion === 'staying_in') {
      await store.dailyIdeas.put({ ...next, state: 'stayingIn' });
      return { samePick: false };
    }
    await store.setKv(KV.touched(id), '1');
    // A new occasion or style is a new plan: what he swapped away before may suit it (M3).
    await store.setKv(KV.swapped(id), '');
    const before = row.outfitId ? (await store.outfits.get(row.outfitId))?.itemIds.join('+') : null;
    const result = await pick(next);
    const outfitId = await saveOutfit(result, next.occasion, row.outfitId);
    await store.dailyIdeas.put({ ...next, outfitId, state: row.state === 'stayingIn' ? 'idea' : row.state });
    if (row.messageId) await store.chat.patch(row.messageId, { outfitId });
    return { samePick: !!before && before === result.outfit?.itemIds.join('+') };
  }

  /**
   * Swap one: the same card without the given pieces, nor any piece swapped away from it before (09 §23 M1, #353; it
   * used to leave out only the last one, so the first outfit came back). When nothing else works without them the card
   * keeps its outfit (it used to go blank) and `swapped` is false: the card says `swap.none` (M2).
   */
  async function swap(id: string, leaveOut: string[]): Promise<{ swapped: boolean }> {
    const row = await store.dailyIdeas.get(id);
    if (!row) return { swapped: false };
    const before = parseIds(await store.getKv(KV.swapped(id)));
    const exclude = new Set([...before, ...leaveOut]);
    const result = await pick(row, { exclude });
    if (!result.outfit) return { swapped: false };
    await store.setKv(KV.touched(id), '1');
    await store.setKv(KV.swapped(id), JSON.stringify([...exclude]));
    const outfitId = await saveOutfit(result, row.occasion, row.outfitId);
    await store.dailyIdeas.put({ ...row, outfitId, state: 'idea' });
    return { swapped: true };
  }

  /**
   * Swap one, the S28 sheet (09-ui-review §28, #377): what could take this piece's place on the card, by the picker's own
   * rules. Never a piece swapped away from this card before (#353 M1). [] when the card can't be swapped (gone, worn,
   * checked) or the piece isn't on it.
   */
  async function swapOptions(id: string, itemId: string): Promise<SwapOption[]> {
    const row = await store.dailyIdeas.get(id);
    if (!row?.outfitId || row.state !== 'idea') return [];
    const outfit = await store.outfits.get(row.outfitId);
    if (!outfit?.itemIds.includes(itemId)) return [];
    const exclude = new Set(parseIds(await store.getKv(KV.swapped(id))));
    return coreSwapOptions({ ...(await pickInput(row, { exclude })), outfit: outfit.itemIds, out: itemId });
  }

  /**
   * He picked a piece in the sheet: the same outfit row with that one piece replaced (the chat message keeps pointing at
   * it), the card touched (#338), the piece swapped away kept out of this card from now on (#353). Returns the Undo, or
   * null when `inId` isn't an option (nothing changes).
   */
  async function swapTo(id: string, outId: string, inId: string): Promise<(() => Promise<void>) | null> {
    const option = (await swapOptions(id, outId)).find((o) => o.itemId === inId);
    const row = await store.dailyIdeas.get(id);
    if (!option || !row?.outfitId) return null;
    const outfitBefore = await store.outfits.get(row.outfitId);
    const touchedBefore = await store.getKv(KV.touched(id));
    const swappedBefore = await store.getKv(KV.swapped(id));
    await store.setKv(KV.touched(id), '1');
    await store.setKv(KV.swapped(id), JSON.stringify([...new Set([...parseIds(swappedBefore), outId])]));
    await saveOutfit({ state: 'enough', outfit: option.outfit, known: [], missingSlots: [] }, row.occasion, row.outfitId);
    return async () => {
      if (outfitBefore) await store.outfits.put(outfitBefore);
      const put = (key: string, v: string | null) => (v === null ? store.deleteKv(key) : store.setKv(key, v));
      await put(KV.touched(id), touchedBefore);
      await put(KV.swapped(id), swappedBefore);
    };
  }

  /** Wear this: logs the day (as the S1 card did) and returns what to put back on Undo. */
  async function wear(id: string): Promise<() => Promise<void>> {
    const row = await store.dailyIdeas.get(id);
    if (!row?.outfitId) return async () => {};
    const now = clock.nowMs();
    const before = await store.wearLog.get(row.dayKey);
    await store.wearLog.put({ day: row.dayKey, fitCheckId: null, outfitId: row.outfitId, createdAt: now });
    await store.dailyIdeas.put({ ...row, state: 'wearing' });
    return async () => {
      if (before) await store.wearLog.put(before);
      else await store.wearLog.delete(row.dayKey);
      await store.dailyIdeas.put({ ...row, state: 'idea' });
    };
  }

  /** He tapped Allow on the card's "Use your local weather?" row: re-plan this card with the weather. */
  async function refreshWeather(id: string): Promise<void> {
    const row = await store.dailyIdeas.get(id);
    if (!row) return;
    const weather = (await forecast(row.slot)) as unknown as Record<string, unknown> | null;
    if (!weather) return;
    const next = { ...row, weather };
    const result = await pick(next);
    const outfitId = await saveOutfit(result, row.occasion, row.outfitId);
    await store.dailyIdeas.put({ ...next, outfitId });
  }

  /**
   * The current card's forecast, fetched again once it's older than WEATHER_STALE_MS (#338), when Stylist shows. A card
   * he hasn't touched (no Wear this, swap or menu change) is re-picked when the fresher weather asks for something else
   * (a layer, rain shoes, a hot day); a touched one keeps its outfit and only its weather words change. A checked or
   * staying-in card shows no weather, so it's left alone. Returns whether anything changed.
   */
  async function freshen(nowMs: number = clock.nowMs()): Promise<boolean> {
    if (deps.enabled && !deps.enabled()) return false;
    const { day, slot } = slotAt(nowMs, zone);
    const first = await store.dailyIdeas.get(ideaId(day, slot));
    if (!first || first.state === 'stayingIn' || first.fitCheckId) return false;
    // A piece on it he corrected, removed or merged away first (§26), then the weather, on the card as it is now.
    const followed = await followPieces(first);
    const row = followed ? (await store.dailyIdeas.get(first.id)) ?? first : first;
    return (await freshenWeather(row, nowMs)) || followed;
  }

  /** The weather half of `freshen` (#338, 09 §23 M5). */
  async function freshenWeather(row: DailyIdeaRow, nowMs: number): Promise<boolean> {
    // No weather yet (location was off): back from Settings with it on, the card gets its forecast now (09 §23 M5).
    if (!row.weather) return gainWeather(row);
    const fetchedAt = typeof row.weather.fetchedAt === 'number' ? row.weather.fetchedAt : row.createdAt;
    if (nowMs - fetchedAt < WEATHER_STALE_MS) return false;
    if ((await deps.weather.permission()) !== 'granted') return false;
    const fresh = (await forecast(row.slot)) as unknown as Record<string, unknown> | null;
    if (!fresh) return false;
    const next = { ...row, weather: fresh };
    const needsOf = (w: Record<string, unknown>) => JSON.stringify(weatherNeeds(w as unknown as DayWeather));
    const untouched = row.state === 'idea' && (await store.getKv(KV.touched(row.id))) !== '1';
    if (untouched && needsOf(fresh) !== needsOf(row.weather)) {
      const result = await pick(next);
      const outfitId = await saveOutfit(result, row.occasion, row.outfitId);
      await store.dailyIdeas.put({ ...next, outfitId });
      if (row.messageId) await store.chat.patch(row.messageId, { outfitId });
    } else {
      await store.dailyIdeas.put(next);
    }
    return true;
  }

  /**
   * The card follows a piece he corrected (09-ui-review §26, #365). A piece on the card whose fingerprint changed (its
   * reading, its sleeves, or it was removed or merged away) re-plans a card he hasn't touched, as it was first planned
   * (same occasion, style, weather, history and seed). A card he swapped or set keeps its outfit while it still works,
   * else it's re-planned without what he swapped away. Wear this, a checked card and Staying in are never changed (nor
   * an earlier card: only the card of this moment comes here). A card saved before fingerprints gets one, nothing else.
   */
  async function followPieces(row: DailyIdeaRow): Promise<boolean> {
    if (row.state !== 'idea' || !row.outfitId) return false;
    const checks = await store.fitChecks.all();
    if (checks.some((c) => !c.parentId && c.status === 'scored' && checkInSlot(c, row, zone))) return false;
    const outfit = await store.outfits.get(row.outfitId);
    if (!outfit) return false;
    const all = await store.closet.all();
    const details = outfit.details as OutfitRow['details'] & { basis?: Record<string, string>; origin?: string };
    const now = basisOf([...new Set([...outfit.itemIds, ...Object.keys(details.basis ?? {})])], all);
    const settle = () => store.outfits.put({ ...outfit, details: { ...details, basis: now } as OutfitRow['details'] });
    if (!details.basis) {
      await settle();
      return false;
    }
    const changed = Object.keys(now).filter((id) => details.basis![id] !== now[id]);
    if (changed.length === 0) return false;
    const live = outfit.itemIds.map((id) => all.find((c) => c.id === id)).filter((c): c is ClosetItemRow => !!c && !c.isDeleted && !c.mergedInto);
    const touched = (await store.getKv(KV.touched(row.id))) === '1';
    if (touched && live.length === outfit.itemIds.length && (await stillWorks(row, live, details.predictedScore))) {
      await settle();
      return false;
    }
    const exclude = touched ? new Set(parseIds(await store.getKv(KV.swapped(row.id)))) : undefined;
    const result = await pick(row, exclude ? { exclude } : {});
    const key = (ids: readonly string[]) => [...ids].sort().join('+');
    if (!result.outfit || key(result.outfit.itemIds) === key(outfit.itemIds)) {
      await settle();
      return false;
    }
    // The line names the corrected piece; none when it was removed, or when the re-plan is back where the card began.
    const origin = details.origin ?? key(outfit.itemIds);
    const back = key(result.outfit.itemIds) === origin;
    const updatedFor = back ? undefined : changed.find((id) => live.some((c) => c.id === id));
    await saveOutfit(result, row.occasion, row.outfitId, { updatedFor, origin: back ? undefined : origin });
    if (row.messageId) await store.chat.patch(row.messageId, { outfitId: row.outfitId });
    return true;
  }

  /** A swapped or set card's outfit still works: the picker's filters pass and its predicted score hasn't fallen below
   *  Put together (or below where it began, when it began lower). */
  async function stillWorks(row: DailyIdeaRow, items: ClosetItemRow[], planned?: number): Promise<boolean> {
    const p = await store.profile.get('me');
    const boldness = p?.boldness ?? 'a_little';
    const styles = styleInput(row.style);
    const occasion = scoringOccasion(row.occasion);
    const w = row.weather as unknown as DayWeather | null;
    const needs = w ? weatherNeeds(w) : seasonNeeds(localParts(clock.nowMs(), zone).m);
    const pieces = items as unknown as ClosetItem[];
    if (!outfitValid(pieces, styles, boldness) || !pieces.every((it) => itemAllowed(it, needs, occasion))) return false;
    const sc = defaultRubric.score(outfitReading(pieces), { occasion, styles, boldness });
    return isScored(sc) && sc.overall >= Math.min(7, planned ?? 7);
  }

  /** A card planned without weather gets it: an untouched one is re-planned for it, a touched one keeps its outfit. */
  async function gainWeather(row: DailyIdeaRow): Promise<boolean> {
    if ((await deps.weather.permission()) !== 'granted') return false;
    const weather = (await forecast(row.slot)) as unknown as Record<string, unknown> | null;
    if (!weather) return false;
    const next = { ...row, weather };
    const untouched = row.state === 'idea' && (await store.getKv(KV.touched(row.id))) !== '1';
    if (untouched) {
      const result = await pick(next);
      const outfitId = await saveOutfit(result, row.occasion, row.outfitId);
      await store.dailyIdeas.put({ ...next, outfitId });
      if (row.messageId) await store.chat.patch(row.messageId, { outfitId });
    } else {
      await store.dailyIdeas.put(next);
    }
    return true;
  }

  return { ensureCard, change, swap, swapOptions, swapTo, wear, refreshWeather, freshen };
}

export type MorningService = ReturnType<typeof createMorningService>;

/** Keys in order, so the same reading always prints the same. */
const stable = (v: unknown): string =>
  JSON.stringify(v, (_k, x: unknown) =>
    x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, (x as Record<string, unknown>)[k]])) : x);

/**
 * What the picker read of a piece when the card planned it (09-ui-review §26, #365): its slot, its reading and its
 * sleeves (the picker reads them, #359), or "gone" once it's removed or merged away. Its name, photos and measured
 * color aren't in it: background closet work changes those after every check.
 */
export function pieceBasis(it: ClosetItemRow | null | undefined): string {
  if (!it || it.isDeleted || it.mergedInto) return 'gone';
  return stable({ slot: it.slot, garment: it.garment, sleeves: (it.art as { sleeves?: unknown } | null | undefined)?.sleeves ?? null });
}
const basisOf = (ids: readonly string[], closet: readonly ClosetItemRow[]): Record<string, string> =>
  Object.fromEntries(ids.map((id) => [id, pieceBasis(closet.find((c) => c.id === id))]));

function parseIds(v: string | null): string[] {
  if (!v) return [];
  try {
    const a: unknown = JSON.parse(v);
    return Array.isArray(a) ? a.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}
