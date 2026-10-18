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
  addDays, dayKey, daysBetween, localParts, pickHistory, pickOutfit, seasonNeeds, weatherNeeds,
  type ClosetItem, type DayWeather, type IdeaResult, type PastUse, type PickHistory, type Styles, type WeatherWindow, type ZoneOffset,
} from '@kitted/core';
import type { KittedStore } from '@/data/store';
import type {
  CardOccasion, ChatMessage, ClosetItemRow, DailyIdeaRow, FitCheckRow, IdeaSlot, OccasionKey, OutfitRow, StyleKey,
} from '@/data/types';
import { normStyleKey, STYLES } from '@/data/types';
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
const HISTORY_DAYS = 14;
const KV = {
  eveningIgnored: 'idea.evening.ignored',
  style: (slot: IdeaSlot) => `idea.style.${slot}`,
  /** He changed the card's occasion or style, or swapped a piece: a fresher forecast never re-picks it (#338). */
  touched: (id: string) => `idea.touched.${id}`,
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

  /**
   * What came before this card: other cards shown (and still showing) and what he wore (Wear
   * this, fit checks), each with how many days ago. Only earlier days count, plus, for the
   * evening card, the same day's card and morning checks. The card's own outfit never counts.
   */
  async function history(row: Pick<DailyIdeaRow, 'id' | 'slot'> & { outfitId?: string | null }): Promise<PickHistory> {
    const day = row.id.split('|')[0] ?? '';
    const from = addDays(day, -HISTORY_DAYS);
    const evening = row.slot === 'evening';
    const before = (d: string, sameDay: boolean) => d >= from && (d < day || (evening && sameDay && d === day));
    const itemsOf = async (outfitId: string) => (await store.outfits.get(outfitId))?.itemIds ?? [];
    const uses: PastUse[] = [];
    for (const r of await store.dailyIdeas.all()) {
      if (r.id === row.id || !r.outfitId || !before(r.dayKey, r.slot === 'day')) continue;
      uses.push({ daysAgo: daysBetween(r.dayKey, day), itemIds: await itemsOf(r.outfitId) });
    }
    // Checks come from the fit-check rows below; the wear log adds what he wore from a card.
    for (const w of await store.wearLog.all()) {
      if (!w.outfitId || w.outfitId === row.outfitId || !before(w.day, true)) continue;
      uses.push({ daysAgo: daysBetween(w.day, day), itemIds: await itemsOf(w.outfitId) });
    }
    for (const c of await store.fitChecks.all()) {
      if (!before(c.dayKey, slotAt(c.createdAt, zone).slot === 'day')) continue;
      uses.push({ daysAgo: daysBetween(c.dayKey, day), itemIds: c.itemIds });
    }
    return pickHistory(uses, (await store.closet.all()) as ClosetItem[]);
  }

  async function pick(row: Pick<DailyIdeaRow, 'id' | 'slot' | 'occasion' | 'style' | 'weather'> & { outfitId?: string | null }, extra: { exclude?: Set<string> } = {}): Promise<IdeaResult> {
    const p = await store.profile.get('me');
    const w = row.weather as unknown as DayWeather | null;
    const month = localParts(clock.nowMs(), zone).m;
    return pickOutfit({
      closet: (await closet()) as ClosetItem[],
      occasion: scoringOccasion(row.occasion),
      styles: styleInput(row.style),
      boldness: p?.boldness ?? 'a_little',
      needs: w ? weatherNeeds(w) : seasonNeeds(month),
      evening: row.slot === 'evening',
      history: await history(row),
      seed: row.id,
      exclude: extra.exclude,
    });
  }

  async function saveOutfit(result: IdeaResult, occasion: CardOccasion, existing: string | null): Promise<string | null> {
    if (!result.outfit) return null;
    const items = await closet();
    const names = result.outfit.itemIds.map((id) => items.find((c) => c.id === id)?.name ?? '').filter(Boolean);
    const row: OutfitRow = {
      id: existing ?? deps.ids('O'),
      itemIds: result.outfit.itemIds,
      occasion,
      title: null,
      summary: names.join(', '),
      details: { predictedScore: result.outfit.predicted, missing: result.outfit.missing, reasons: result.outfit.reasons } as OutfitRow['details'],
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
    const before = row.outfitId ? (await store.outfits.get(row.outfitId))?.itemIds.join('+') : null;
    const result = await pick(next);
    const outfitId = await saveOutfit(result, next.occasion, row.outfitId);
    await store.dailyIdeas.put({ ...next, outfitId, state: row.state === 'stayingIn' ? 'idea' : row.state });
    if (row.messageId) await store.chat.patch(row.messageId, { outfitId });
    return { samePick: !!before && before === result.outfit?.itemIds.join('+') };
  }

  /** Swap one: the same card, with the given items left out. */
  async function swap(id: string, leaveOut: string[]): Promise<void> {
    const row = await store.dailyIdeas.get(id);
    if (!row) return;
    await store.setKv(KV.touched(id), '1');
    const result = await pick(row, { exclude: new Set(leaveOut) });
    const outfitId = await saveOutfit(result, row.occasion, row.outfitId);
    await store.dailyIdeas.put({ ...row, outfitId, state: 'idea' });
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
    const row = await store.dailyIdeas.get(ideaId(day, slot));
    if (!row?.weather || row.state === 'stayingIn' || row.fitCheckId) return false;
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

  return { ensureCard, change, swap, wear, refreshWeather, freshen };
}

export type MorningService = ReturnType<typeof createMorningService>;
