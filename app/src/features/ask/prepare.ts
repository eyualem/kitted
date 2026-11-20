// One question made ready to send (07 §5 steps 2–3): the pack, the route, the evidence, the prompt and the gate's
// numbers, plus the code that checks the model's closing block (the lookup, the card, the remember). Store and clock
// injected, so tests run it on the memory store.
import { dayKey, localParts } from '@kitted/core';
import type { KittedStore } from '@/data/store';
import type { FitCheckRow } from '@/data/types';
import type { Clock } from '@/services/clock';
import { SHARE_CARD_BUILT } from '@/config/features';
import { accountsOn, settingsAccountOn } from '@/features/account/account';
import { outfitsOn } from '@/features/closet/outfitsSwitch';
import { isOwned } from '@/features/closet/profile';
import { notificationsOn, paywallOn } from '@/features/paywall/switch';
import { getStarterMarks } from '@/features/finish/service';
import { askedAgain, buildCard, cardSpoken, correctCard, shownKeysToday } from './cards';
import { displayScore } from '@/design-system/score';
import { weekdayName } from '@/i18n/format';
import { t } from '@/i18n/en';
import { buildStylistContext } from './context';
import { allowedForCard, allowedScores, buildEvidence, colorEvidence, parseLookup, routeOfLookup, shownCardLines, type EvidenceDeps } from './evidence';
import { pricesIn } from './gate';
import { planAdd } from './addCard';
import { applyRemember } from './memory';
import type { Prepared } from './pipeline';
import { systemPrompt, userPrompt, type AppSwitches } from './prompt';
import { routeQuestion } from './router';
import { loadStylistSnapshot } from './snapshot';

export interface PrepareDeps {
  store: KittedStore;
  clock: Clock;
  ids: (prefix: string) => string;
  /** For the log only. */
  log?: (line: string) => void;
}

/** What the pipeline knows of the question beyond its words: the card his tap answered, and when he asked. */
export interface PrepareMeta {
  tapOf?: string | null;
  at?: number;
}

/** Which switchable parts of the app are live right now, read from the real switches (never a copy of a constant). */
function liveSwitches(): AppSwitches {
  return { outfits: outfitsOn(), share: SHARE_CARD_BUILT, paywall: paywallOn(), accounts: settingsAccountOn() || accountsOn(), notifications: notificationsOn() };
}

export function createPrepare(deps: PrepareDeps): (question: string, meta?: PrepareMeta) => Promise<Prepared> {
  const { store, clock } = deps;
  const run = async (question: string, meta: PrepareMeta | undefined, box: { rollback?: (() => Promise<void>) | undefined }): Promise<Prepared> => {
    let snap = await loadStylistSnapshot(store, clock);
    let ctx = buildStylistContext(snap, question, { shownCards: shownCardLines(snap) });
    const today = dayKey(snap.nowMs, snap.zone);
    const dayOf = (c: FitCheckRow) => ({ dow: localParts(c.createdAt, snap.zone).dow, today: c.dayKey === today });
    const route = routeQuestion(question, { closet: snap.closet, checks: snap.checks, context: ctx, dayOf });
    // T106 (KC4): his mention or "add it", read by code before Kit answers. An explicit add is written here, so the pack
    // and the gate below already know the piece.
    const plan = await planAdd({ question, read: route.add ?? null, tapOf: meta?.tapOf ?? null, at: meta?.at ?? snap.nowMs, zone: snap.zone, store, deps: { store, clock, ids: deps.ids } });
    box.rollback = plan.rollback;
    if (plan.didAdd) {
      snap = await loadStylistSnapshot(store, clock);
      ctx = buildStylistContext(snap, question, { shownCards: shownCardLines(snap) });
    }
    const marks = await getStarterMarks(store);
    const evDeps: EvidenceDeps = {
      readingOf: async (id) => (id ? (await store.readings.get(id))?.reading ?? null : null),
      starterMarks: marks,
    };
    // An unsure route sends the pack alone; the model may ask for one lookup (R3).
    const ev = route.sure ? await buildEvidence(route, snap, ctx, evDeps) : { text: '', kind: route.kind };
    if (plan.evidence) ev.text = [ev.text, plan.evidence].filter(Boolean).join('\n');
    // "That score is wrong" about today's check (09 §20.8 G19): the answer gets its Not quite right?, and the model is
    // told the button is there so it can point to it.
    const correct = correctCard(route, ctx.handles, snap.checks, today);
    if (correct) ev.text = [ev.text, 'Under your answer the app shows a "Not quite right?" button for this check: it lets him fix a piece the photo read wrong, and the check is scored again from that.'].filter(Boolean).join('\n');
    // KC3.3: the colors the rules would not mark down, for a color question; the gate and the card check read the same list.
    const col = colorEvidence(question, route, snap, ctx, evDeps);
    if (col) ev.text = [ev.text, col.text].filter(Boolean).join('\n');
    deps.log?.(`route · ${route.kind}${route.sure ? '' : ' (unsure)'} · ${route.pieces.length} pieces${route.check ? ' · a check' : ''}${ev.text ? ' · evidence' : ''}`);
    const owned = snap.closet.filter((c) => isOwned(c) && !c.isDeleted && !c.mergedInto);
    const gatePieces = owned.map((c) => {
      const g = c.garment as Record<string, unknown>;
      const str = (k: string) => (typeof g[k] === 'string' ? String(g[k]) : '');
      return { name: c.name, category: str('category'), subcategory: str('subcategory'), color: str('color_family'), leg: str('leg_shape') };
    });
    const baseGate = {
      allowedScores: allowedScores(ctx.text, ev.text),
      pieceNames: snap.closet.map((c) => c.name),
      pieces: gatePieces,
      allowedPrices: new Set([...pricesIn(ctx.text), ...pricesIn(ev.text)]),
      outfitsOn: outfitsOn(),
      ...(plan.didAdd ? { didAdd: true } : {}),
      ...(col ? { allowedColors: col.allowed, ownColors: col.own } : {}),
    };
    return {
      kind: route.kind,
      ...(ev.verdict ? { verdict: ev.verdict } : {}),
      prompt: { system: systemPrompt(route.kind, liveSwitches()), user: userPrompt(ctx.text, ev.text, question) },
      gate: baseGate,
      lookup: async (need) => {
        const l = parseLookup(need, ctx.handles);
        if (!l) return null;
        const r = routeOfLookup(l);
        const ev2 = await buildEvidence(r, snap, ctx, evDeps);
        if (!ev2.text) return null;
        return {
          prompt: { system: systemPrompt(r.kind, liveSwitches()), user: userPrompt(ctx.text, ev2.text, question) },
          gate: { ...baseGate, allowedScores: allowedScores(ctx.text, ev2.text), allowedPrices: new Set([...pricesIn(ctx.text), ...pricesIn(ev2.text)]) },
        };
      },
      rollback: plan.rollback,
      payloadFor: (card) => (card && card === plan.card && plan.payload ? plan.payload : {}),
      card: async (raw, gate) => {
        // The add card (T106) is the code's, never the model's. A mention yields to a real card the model made for a
        // question that came with it (one card per answer, KC1.2).
        if (plan.card && !plan.yieldsToModel) return plan.card;
        const made = correct ?? buildCard(raw, {
        handles: ctx.handles, closet: snap.closet, checks: snap.checks, styles: snap.profile?.styles ?? null, starterMarks: marks, gate,
        // KC3.3: a colors card is checked against the list even when the question wasn't detected as one.
        allowedColors: gate.allowedColors ?? allowedForCard(raw, snap, ctx, evDeps),
        // The same outfit isn't drawn twice in one chat day unless he asks again (KC2.6).
        shownToday: askedAgain(question) ? new Set<string>() : shownKeysToday(snap.chat, today, snap.zone),
        });
        return plan.card && (!made || made.type === 'link') ? plan.card : made;
      },
      remember: (raw, at) => applyRemember(raw, at, { store, clock, ids: deps.ids }),
      speak: (card) => cardSpoken(card, {
        nameOf: (id) => snap.closet.find((c) => c.id === id && !c.isDeleted)?.name ?? null,
        checkLabel: (id) => {
          const c = snap.checks.find((x) => x.id === id);
          if (!c) return null;
          const label = c.dayKey === today ? t('ask.card.link.today') : t('ask.card.link.day', { day: weekdayName(localParts(c.createdAt, snap.zone).dow) });
          return c.score === null ? label : `${label}, ${displayScore(c.score)}`;
        },
      }),
    };
  };
  // The explicit add is written before the rest is built; if building throws, no answer will confirm it, so it goes back.
  return async (question, meta) => {
    const box: { rollback?: (() => Promise<void>) | undefined } = {};
    try {
      return await run(question, meta, box);
    } catch (e) {
      await box.rollback?.().catch(() => {});
      throw e;
    }
  };
}
