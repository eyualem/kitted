// One question made ready to send (07 §5 steps 2–3): the pack, the route, the evidence, the prompt and the gate's
// numbers, plus the code that checks the model's closing block (the lookup, the card, the remember). Store and clock
// injected, so tests run it on the memory store.
import { dayKey, localParts } from '@kitted/core';
import type { KittedStore } from '@/data/store';
import type { FitCheckRow } from '@/data/types';
import type { Clock } from '@/services/clock';
import { isOwned } from '@/features/closet/profile';
import { getStarterMarks } from '@/features/finish/service';
import { buildCard, cardSpoken, correctCard } from './cards';
import { displayScore } from '@/design-system/score';
import { weekdayName } from '@/i18n/format';
import { t } from '@/i18n/en';
import { buildStylistContext } from './context';
import { allowedScores, buildEvidence, parseLookup, routeOfLookup, type EvidenceDeps } from './evidence';
import { applyRemember } from './memory';
import type { Prepared } from './pipeline';
import { systemPrompt, userPrompt } from './prompt';
import { routeQuestion } from './router';
import { loadStylistSnapshot } from './snapshot';

export interface PrepareDeps {
  store: KittedStore;
  clock: Clock;
  ids: (prefix: string) => string;
  /** For the log only. */
  log?: (line: string) => void;
}

export function createPrepare(deps: PrepareDeps): (question: string) => Promise<Prepared> {
  const { store, clock } = deps;
  return async (question) => {
    const snap = await loadStylistSnapshot(store, clock);
    const ctx = buildStylistContext(snap, question);
    const today = dayKey(snap.nowMs, snap.zone);
    const dayOf = (c: FitCheckRow) => ({ dow: localParts(c.createdAt, snap.zone).dow, today: c.dayKey === today });
    const route = routeQuestion(question, { closet: snap.closet, checks: snap.checks, context: ctx, dayOf });
    const marks = await getStarterMarks(store);
    const evDeps: EvidenceDeps = {
      readingOf: async (id) => (id ? (await store.readings.get(id))?.reading ?? null : null),
      starterMarks: marks,
    };
    // An unsure route sends the pack alone; the model may ask for one lookup (R3).
    const ev = route.sure ? await buildEvidence(route, snap, ctx, evDeps) : { text: '', kind: route.kind };
    // "That score is wrong" about today's check (09 §20.8 G19): the answer gets its Not quite right?, and the model is
    // told the button is there so it can point to it.
    const correct = correctCard(route, ctx.handles, snap.checks, today);
    if (correct) ev.text = [ev.text, 'Under your answer the app shows a "Not quite right?" button for this check: it lets him fix a piece the photo read wrong, and the check is scored again from that.'].filter(Boolean).join('\n');
    deps.log?.(`route · ${route.kind}${route.sure ? '' : ' (unsure)'} · ${route.pieces.length} pieces${route.check ? ' · a check' : ''}${ev.text ? ' · evidence' : ''}`);
    const owned = snap.closet.filter((c) => isOwned(c) && !c.isDeleted && !c.mergedInto);
    const gatePieces = owned.map((c) => {
      const g = c.garment as Record<string, unknown>;
      const str = (k: string) => (typeof g[k] === 'string' ? String(g[k]) : '');
      return { name: c.name, category: str('category'), subcategory: str('subcategory'), color: str('color_family'), leg: str('leg_shape') };
    });
    const hasBody = snap.profile !== null && (snap.profile.heightCm !== null || ['slim', 'average', 'athletic', 'broad', 'bigger'].includes(snap.profile.build));
    return {
      kind: route.kind,
      ...(ev.verdict ? { verdict: ev.verdict } : {}),
      prompt: { system: systemPrompt(route.kind), user: userPrompt(ctx.text, ev.text, question) },
      gate: { allowedScores: allowedScores(ctx.text, ev.text), hasBody, pieceNames: snap.closet.map((c) => c.name), pieces: gatePieces },
      lookup: async (need) => {
        const l = parseLookup(need, ctx.handles);
        if (!l) return null;
        const r = routeOfLookup(l);
        const ev2 = await buildEvidence(r, snap, ctx, evDeps);
        if (!ev2.text) return null;
        return {
          prompt: { system: systemPrompt(r.kind), user: userPrompt(ctx.text, ev2.text, question) },
          gate: { allowedScores: allowedScores(ctx.text, ev2.text), hasBody, pieceNames: snap.closet.map((c) => c.name), pieces: gatePieces },
        };
      },
      card: async (raw, gate) => correct ?? buildCard(raw, {
        handles: ctx.handles, closet: snap.closet, checks: snap.checks, styles: snap.profile?.styles ?? null, starterMarks: marks, gate,
      }),
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
}
