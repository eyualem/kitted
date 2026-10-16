// One question, start to finish (07 §5, §6; 02 S25–S27). Pure apart from what's injected, so tests run it on the
// memory store and a manual clock.
//   1. On the phone first, nothing sent, never counted: distress words → the support card (S27); a message that's
//      only "rate my face" / "am I ugly" → "I rate outfits, never people."
//   2. Then the gates for what would be sent: one question at a time; consent (else the agreement opens, S26);
//      online; the daily limit (else the S25 limit line). Consent, offline and busy write nothing and keep the draft.
//   3. His bubble, then the answer streams into the in-memory live row (live.ts) and is written once, when done.
//   4. Counted only when a 'done' arrives with text and isn't a refusal or a placeholder (07 §6.2): failures,
//      refusals, the support card, the limit line and "coming soon" are free. A counted question's bubble gets
//      payload.counts (the seed's flag for the same thing).
// Distress comes before the gates on purpose: the support card must show even with no consent or no questions left.
import type { KittedStore } from '@/data/store';
import type { ChatMessage } from '@/data/types';
import { t } from '@/i18n/en';
import type { Clock } from '@/services/clock';
import type { QuotaService } from '@/services/quota';
import type { Scheduler } from '@/services/scheduler';
import type { AskCard } from './cards';
import { createSentenceStream, type GateContext, type GateRule } from './gate';
import { isBodyRating, isDistress } from './guards';
import { liveAnswer as defaultLive } from './live';
import type { AnswerEvent, AnswerSource } from './source';

/** No first word by then: "Taking longer…" (07 §6.4). */
export const SLOW_MS = 6_000;
/** No first word by then, or the stream stalls that long: the fail line, nothing counted (07 §6.4, A3). */
export const GIVE_UP_MS = 20_000;

/** One question made ready to send (session.ts builds it: the pack, the route, the evidence, the prompt). */
export interface Prepared {
  prompt?: { system: string; user: string };
  gate: GateContext;
  /** The model asked for one lookup (R3): the second call's prompt and gate, or null when it can't be computed. */
  lookup?: (need: unknown) => Promise<{ prompt: { system: string; user: string }; gate: GateContext } | null>;
  /** The model's card, checked by code (R4); null drops it. */
  card?: (raw: unknown, gate: GateContext) => Promise<AskCard | null>;
  /** The model's remember, checked and saved (C4); the saved fact's id for "Saved · Undo", or null. */
  remember?: (raw: unknown, answerAt: number) => Promise<{ factId: string; itemId?: string } | null>;
  /** For the log: the router's kind (never his words). */
  kind?: string;
  /** The rules' verdict on the outfit he asked about (J5); an answer whose own verdict says the opposite loses its
   *  card and is logged (measured before anything stricter). */
  verdict?: 'yes' | 'depends' | 'no';
  /** What VoiceOver reads after the answer (P2): the card's words, or null. */
  speak?: (card: AskCard | null) => string | null;
}

const NO_PREP: Prepared = { gate: { allowedScores: new Set() } };

/** The model said yes where the rules find a problem, or no where they find none (J5). "depends" never clashes. */
export function verdictClash(rules: 'yes' | 'depends' | 'no' | undefined, model: unknown): boolean {
  return (rules === 'yes' && model === 'no') || (rules === 'no' && model === 'yes');
}

export interface AskDeps {
  store: Pick<KittedStore, 'chat'>;
  quota: Pick<QuotaService, 'snapshot' | 'canAskQuestion' | 'consumeQuestion'>;
  clock: Clock;
  ids: (prefix: string) => string;
  /** Picked per question (the demo's seeded answers, "coming soon", or the real model once CHAT_LIVE is on). */
  source: () => AnswerSource | Promise<AnswerSource>;
  /** The pack, route, evidence and prompt for a question (C2–C4). Without it: no prompt, nothing may be scored. */
  prepare?: (question: string) => Promise<Prepared>;
  /** The 6 s / 20 s first-word timers (07 §6.4). Without it: no timers (tests that don't test them). */
  scheduler?: Pick<Scheduler, 'setTimer' | 'clearTimer'>;
  /** His agreement to send to Google (mayUpload): questions go to the AI too (02 S26). */
  consent: () => Promise<boolean>;
  /** Opens the agreement; the draft waits in the composer. */
  openConsent: () => void;
  /** No connectivity signal exists in the app yet: true until one does (07 §6.4 offline state). */
  online?: () => boolean;
  /** The paywall is built (P6): the free limit line gets "Try Pro". */
  tryPro: () => boolean;
  /** Event names only, never his words (02 S27, 07 §7.5). */
  log?: (event: string) => void;
  /** VoiceOver reads the answer once it's complete (07 §6.1). */
  onAnswered?: (text: string) => void;
  live?: typeof defaultLive;
}

export type AskOutcome =
  /** Nothing written; the draft stays in the composer. */
  | { kind: 'empty' | 'busy' | 'consent' | 'offline' }
  /** His bubble and the phone's own reply; nothing sent, nothing counted. */
  | { kind: 'support' | 'refused' | 'limit'; questionId: string }
  | { kind: 'sent'; questionId: string; done: Promise<AnswerResult> };

export type AnswerResult =
  | { kind: 'answered'; messageId: string; counted: boolean }
  | { kind: 'failed'; messageId: string; code: string };

/** The draft is cleared only when the question made it into the thread. */
export const keepsDraft = (o: AskOutcome): boolean => o.kind === 'empty' || o.kind === 'busy' || o.kind === 'consent' || o.kind === 'offline';

/** Payload keys on rows the chat writes (the thread reads them). */
export interface AskPayload {
  /** On his bubble: this question was counted toward today's limit. */
  counts?: true;
  /** On an answer: the question it answers. */
  answerTo?: string;
  /** On fail.ask: the question Retry asks again. */
  askRetry?: string;
  /** On the paused line (07 §6.4, P3): no Retry, nothing counted. */
  askPaused?: true;
  /** On an answer: its one card (cards.ts), stored by id. */
  askCard?: AskCard;
  /** On an answer: the fact it saved ("Saved to what I know · Undo", C4), and the closet piece it added, if any. */
  savedFact?: string;
  savedPiece?: string;
  /** On his bubble: an answer to an ask card's question (a tap, never counted). */
  tapOf?: string;
  /** On an answer with an ask card: the option he tapped (the card's buttons are done). */
  askTapped?: string;
  /** On a refusal (the phone's or the model's). */
  askRefused?: true;
  /** On the limit line: show "Try Pro". */
  tryPro?: boolean;
}

function row(id: string, createdAt: number, role: ChatMessage['role'], text: string, extra: Partial<ChatMessage> = {}, payload: AskPayload = {}): ChatMessage {
  return {
    id, createdAt, role, kind: 'text', text, cardType: null, fitCheckId: null, outfitId: null, itemId: null, chips: [],
    payload: payload as Record<string, unknown>, ...extra,
  };
}

export function createAsk(deps: AskDeps) {
  const { store, quota, clock, ids } = deps;
  const live = deps.live ?? defaultLive;
  const log = deps.log ?? (() => {});
  const online = deps.online ?? (() => true);
  let busy = false;

  /** The gates for anything that would be sent (consent, online, the limit). Null = go. */
  async function gates(): Promise<'consent' | 'offline' | 'limit' | null> {
    if (!(await deps.consent())) return 'consent';
    if (!online()) return 'offline';
    if (!(await quota.canAskQuestion())) return 'limit';
    return null;
  }

  async function limitLine(after: number): Promise<void> {
    const pro = (await quota.snapshot()).pro;
    await store.chat.put(row(ids('M'), after + 1, 'stylist', t(pro ? 'ask.limit.pro' : 'ask.limit.free'), { kind: 'card', cardType: 'limit' }, { tryPro: !pro && deps.tryPro() }));
  }

  /** One call to the source, gated sentence by sentence (A4–A5), with the first-word timers (A3). */
  async function call(
    source: AnswerSource, question: ChatMessage, prompt: Prepared['prompt'], gate: GateContext, followUp: boolean,
  ): Promise<{ done: Extract<AnswerEvent, { type: 'done' }> | null; failed: string | null; text: string; dropped: GateRule[] }> {
    const ctrl = new AbortController();
    const sentences = createSentenceStream(gate);
    let failed: string | null = null;
    let done: Extract<AnswerEvent, { type: 'done' }> | null = null;
    const sch = deps.scheduler;
    let slowTimer: unknown = null;
    let giveUp: unknown = null;
    // The give-up races the stream, so a source that never answers can't hold the question forever.
    let stop: () => void = () => {};
    const stopped = new Promise<'stop'>((r) => { stop = () => r('stop'); });
    const armGiveUp = () => {
      if (!sch) return;
      if (giveUp !== null) sch.clearTimer(giveUp);
      giveUp = sch.setTimer(() => {
        failed = 'timeout';
        ctrl.abort();
        stop();
      }, GIVE_UP_MS);
    };
    if (sch) slowTimer = sch.setTimer(() => live.slow(), SLOW_MS);
    armGiveUp();
    const it = source.answer({ question: question.text ?? '', signal: ctrl.signal, ...(prompt ? { prompt } : {}), ...(followUp ? { followUp } : {}) });
    try {
      for (;;) {
        const next = await Promise.race([it.next(), stopped]);
        if (next === 'stop' || failed) break;
        if (next.done) break;
        const ev = next.value;
        if (ev.type === 'delta') {
          armGiveUp(); // a stream that stalls 20 s gives up too
          const show = sentences.push(ev.text);
          if (show) live.append(show);
        } else if (ev.type === 'done') {
          done = ev;
          break;
        } else {
          failed = ev.code;
          break;
        }
      }
    } catch {
      failed = failed ?? 'threw';
    } finally {
      if (sch) {
        if (slowTimer !== null) sch.clearTimer(slowTimer);
        if (giveUp !== null) sch.clearTimer(giveUp);
      }
      if (failed) void it.return?.(undefined)?.catch(() => {});
    }
    if (!failed && done) {
      const rest = sentences.end();
      if (rest) live.append(rest);
    }
    return { done, failed, text: sentences.text, dropped: sentences.dropped };
  }

  async function stream(question: ChatMessage, replaces: ChatMessage | null, o: { tap?: boolean } = {}): Promise<AnswerResult> {
    busy = true;
    live.start(question.id, replaces?.id ?? null);
    let text = '';
    let done: Extract<AnswerEvent, { type: 'done' }> | null = null;
    let failed: string | null = null;
    let prep: Prepared = NO_PREP;
    let gate: GateContext = NO_PREP.gate;
    const dropped: GateRule[] = [];
    try {
      prep = deps.prepare ? await deps.prepare(question.text ?? '') : NO_PREP;
      gate = prep.gate;
      const source = await deps.source();
      let r = await call(source, question, prep.prompt, gate, false);
      dropped.push(...r.dropped);
      // One lookup at most (R3): the model's first line goes, and the answer comes from the second call.
      if (!r.failed && r.done?.need && prep.lookup) {
        const next = await prep.lookup(r.done.need).catch(() => null);
        if (next) {
          live.restart();
          gate = next.gate;
          r = await call(source, question, next.prompt, gate, true);
          dropped.push(...r.dropped);
          if (r.done) r.done = { ...r.done, need: null };
          log('lookup');
        }
      }
      text = r.text;
      done = r.done;
      failed = r.failed;
    } catch {
      failed = 'threw';
    }
    for (const rule of dropped) log(`gate · ${rule}`);
    const answer = text.trim();
    if (!failed && !done) failed = 'noDone';
    if (!failed && !answer) failed = dropped.length ? 'gated' : 'empty';
    const at = replaces?.createdAt ?? Math.max(clock.nowMs(), question.createdAt + 1);
    try {
      if (failed === 'paused') {
        // The server's spend stop (C6): its own line, no Retry (it would only be paused again), nothing counted.
        const id = replaces?.id ?? ids('M');
        await store.chat.put(row(id, at, 'stylist', t('ask.paused'), {}, { askPaused: true }));
        live.clear();
        log('paused');
        return { kind: 'failed', messageId: id, code: 'paused' };
      }
      if (failed || !done) {
        const id = replaces?.id ?? ids('M');
        await store.chat.put(row(id, at, 'stylist', t('fail.ask'), {}, { askRetry: question.id }));
        live.clear();
        log(`failed · ${failed}`);
        return { kind: 'failed', messageId: id, code: failed ?? 'noDone' };
      }
      const counted = done.refused !== true && done.uncounted !== true && !o.tap;
      const id = ids('M');
      const clash = verdictClash(prep.verdict, done.verdict);
      if (clash) log('gate · verdict');
      const card = done.refused || clash || !prep.card ? null : await prep.card(done.card, gate).catch(() => null);
      const saved = done.refused || !prep.remember ? null : await prep.remember(done.remember, at).catch(() => null);
      // The live row keeps showing the words until the thread has this row (live.ts).
      live.finish(id, answer);
      if (replaces) await store.chat.delete(replaces.id);
      await store.chat.put(row(id, at, 'stylist', answer, {}, {
        answerTo: question.id, ...(done.refused ? { askRefused: true as const } : {}), ...(card ? { askCard: card } : {}),
        ...(saved ? { savedFact: saved.factId, ...(saved.itemId ? { savedPiece: saved.itemId } : {}) } : {}),
      }));
      if (counted) {
        await quota.consumeQuestion();
        await store.chat.patch(question.id, { payload: { ...question.payload, counts: true } });
      }
      log(`${counted ? 'answered · counted' : done.refused ? 'answered · refused' : o.tap ? 'answered · a tap' : 'answered · not counted'}${prep.kind ? ` · ${prep.kind}` : ''}${card ? ` · card ${card.type}` : ''}${saved ? ' · saved' : ''}`);
      // Read once, complete, with its card and the saved line (07 §6.1, P2).
      const spoken = [answer, prep.speak?.(card) ?? null, saved ? t('ask.saved') : null].filter(Boolean).join(' ');
      deps.onAnswered?.(spoken.endsWith('.') || spoken.endsWith('?') ? spoken : `${spoken}.`);
      return { kind: 'answered', messageId: id, counted };
    } finally {
      busy = false;
    }
  }

  return {
    /** Busy: a question is in flight (the composer's send waits). */
    get busy() {
      return busy;
    },

    async ask(input: string): Promise<AskOutcome> {
      const text = input.trim();
      if (!text) return { kind: 'empty' };
      const now = clock.nowMs();
      const bubble = () => row(ids('M'), now, 'user', text);
      if (isDistress(text)) {
        const q = bubble();
        await store.chat.put(q);
        await store.chat.put(row(ids('M'), now + 1, 'stylist', t('support.text'), { kind: 'card', cardType: 'support' }));
        log('support');
        return { kind: 'support', questionId: q.id };
      }
      if (isBodyRating(text)) {
        const q = bubble();
        await store.chat.put(q);
        await store.chat.put(row(ids('M'), now + 1, 'stylist', t('ask.refuseFace'), {}, { askRefused: true }));
        log('refused · on the phone');
        return { kind: 'refused', questionId: q.id };
      }
      if (busy || live.inFlight()) return { kind: 'busy' };
      const gate = await gates();
      if (gate === 'consent') {
        deps.openConsent();
        log('consent');
        return { kind: 'consent' };
      }
      if (gate === 'offline') return { kind: 'offline' };
      const q = bubble();
      await store.chat.put(q);
      if (gate === 'limit') {
        await limitLine(now);
        log('limit');
        return { kind: 'limit', questionId: q.id };
      }
      return { kind: 'sent', questionId: q.id, done: stream(q, null) };
    },

    /**
     * An ask card's answer (R6): his tap becomes his reply and the stylist answers it, never counted (a tap on its own
     * question isn't a new question, 07 §6.2), so it works at the daily limit too. The card keeps the answer he picked.
     */
    async tap(cardMessageId: string, option: string): Promise<AskOutcome> {
      const card = await store.chat.get(cardMessageId);
      const c = card?.payload.askCard as AskCard | undefined;
      if (!card || !c || c.type !== 'ask' || !c.options.includes(option) || typeof card.payload.askTapped === 'string') return { kind: 'empty' };
      if (busy || live.inFlight()) return { kind: 'busy' };
      if (!(await deps.consent())) {
        deps.openConsent();
        return { kind: 'consent' };
      }
      if (!online()) return { kind: 'offline' };
      await store.chat.patch(card.id, { payload: { ...card.payload, askTapped: option } });
      const q = row(ids('M'), Math.max(clock.nowMs(), card.createdAt + 1), 'user', option, {}, { tapOf: card.id });
      await store.chat.put(q);
      return { kind: 'sent', questionId: q.id, done: stream(q, null, { tap: true }) };
    },

    /** fail.ask's Retry: the same question again, into the failed line's place. Null when there's nothing to retry. */
    async retry(failedId: string): Promise<AskOutcome | null> {
      const failed = await store.chat.get(failedId);
      const qid = typeof failed?.payload.askRetry === 'string' ? failed.payload.askRetry : null;
      const q = qid ? await store.chat.get(qid) : null;
      if (!failed || !q) return null;
      if (busy || live.inFlight()) return { kind: 'busy' };
      const gate = await gates();
      if (gate === 'consent') {
        deps.openConsent();
        return { kind: 'consent' };
      }
      if (gate === 'offline') return { kind: 'offline' };
      if (gate === 'limit') {
        await limitLine(Math.max(clock.nowMs(), failed.createdAt));
        return { kind: 'limit', questionId: q.id };
      }
      return { kind: 'sent', questionId: q.id, done: stream(q, failed, { tap: typeof q.payload.tapOf === 'string' }) };
    },
  };
}

export type AskService = ReturnType<typeof createAsk>;
