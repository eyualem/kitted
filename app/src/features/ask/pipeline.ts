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
import { questionLimitText, type QuotaService } from '@/services/quota';
import type { Scheduler } from '@/services/scheduler';
import { checkFollowUps, type AskCard } from './cards';
import { createSentenceStream, cutAnswer, DRAWN_CARD_TYPES, type GateContext, type GateRule } from './gate';
import { isBodyRating, isDistress, isUnderage } from './guards';
import { liveAnswer as defaultLive } from './live';
import type { AnswerEvent, AnswerSource } from './source';

/** The gate rules about his body: a reply they (with any others) empty is a reply about him, not a failure (T117). */
const BODY_RULES: ReadonlySet<GateRule> = new Set<GateRule>(['body', 'build', 'height']);

/** No first word by then: "Taking longer…" (07 §6.4). */
/** The longest question (09 §20.7 R8, #323): the field takes no more, and the send path cuts dictation to it, so a
 *  pasted essay never becomes the prompt (a cost risk once the server pays). */
export const QUESTION_MAX_CHARS = 500;

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
  /** The phone's connection (services/connectivity.ts; 07 §6.4, 09 §20.8 G18). Default: online. */
  online?: () => boolean;
  /** A call failed for no connection: is the phone really offline? (G18.4: then the offline line, not fail.ask.)
   *  Default: yes. Any answer that arrives reports the phone online. */
  confirmOffline?: () => Promise<boolean>;
  reportOnline?: () => void;
  /** The paywall is built (P6): the free limit line gets "Try Pro". */
  tryPro: () => boolean;
  /** Event names only, never his words (02 S27, 07 §7.5). */
  log?: (event: string) => void;
  /** VoiceOver reads the answer once it's complete (07 §6.1). */
  onAnswered?: (text: string) => void;
  /**
   * Any other stylist line it posts (the support card, a refusal, the limit line, the failed or paused line): VoiceOver
   * hears those once too (07 §17, U14); before, only an answer was spoken, so a distress message got silence.
   */
  onPosted?: (text: string) => void;
  /** After an answer is in the thread (not a failed, limited or offline one): Kit's "About you" card may follow it
   *  (10-onboarding.md §10.2 T1). Never counted. */
  afterAnswer?: (a: { kind: string | null; at: number; refused: boolean; uncounted: boolean }) => Promise<unknown>;
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
  /** On an answer: 1 to 3 follow-up taps, checked by code (cards.ts). Shown under the newest answer only. */
  followUps?: string[];
  /** On a refusal (the phone's or the model's). */
  askRefused?: true;
  /** On the limit line: show "Try Pro". */
  tryPro?: boolean;
}

/**
 * The taps under the newest answer (KC1.3), or null. Only the rows after his last message count, and only the last
 * answer among them (a row with `answerTo`): a new question hides the taps, and a limit line, a decline, the support
 * card and a fail line have none. A refused answer shows none even if the row has them.
 */
export function latestFollowUps(thread: readonly ChatMessage[]): { messageId: string; taps: string[] } | null {
  let from = thread.length;
  while (from > 0 && thread[from - 1]!.role !== 'user') from--;
  for (let i = thread.length - 1; i >= from; i--) {
    const m = thread[i]!;
    if (m.role !== 'stylist' || typeof m.payload.answerTo !== 'string') continue;
    const taps = m.payload.followUps;
    if (m.payload.askRefused || !Array.isArray(taps)) return null;
    const list = taps.filter((x): x is string => typeof x === 'string' && x.length > 0);
    return list.length ? { messageId: m.id, taps: list } : null;
  }
  return null;
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

  async function limitLine(after: number): Promise<string> {
    const snapshot = await quota.snapshot();
    const text = questionLimitText(snapshot);
    const id = ids('M');
    await store.chat.put(row(id, after + 1, 'stylist', text, { kind: 'card', cardType: 'limit' }, { tryPro: snapshot.tier === 'free' && deps.tryPro() }));
    deps.onPosted?.(text);
    return id;
  }

  /** One call to the source, gated sentence by sentence (A4–A5), with the first-word timers (A3). */
  async function call(
    source: AnswerSource, question: ChatMessage, prompt: Prepared['prompt'], gate: GateContext, followUp: boolean, tap = false,
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
    const it = source.answer({ question: question.text ?? '', signal: ctrl.signal, ...(prompt ? { prompt } : {}), ...(followUp ? { followUp } : {}), ...(tap ? { tap } : {}) });
    try {
      for (;;) {
        const next = await Promise.race([it.next(), stopped]);
        if (next === 'stop' || failed) break;
        if (next.done) break;
        const ev = next.value;
        if (ev.type === 'delta') {
          armGiveUp(); // a stream that stalls 20 s gives up too
          const show = sentences.push(ev.text);
          if (show) live.append(show, question.id);
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
      if (rest) live.append(rest, question.id);
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
      let r = await call(source, question, prep.prompt, gate, false, o.tap === true);
      dropped.push(...r.dropped);
      // One lookup at most (R3): the model's first line goes, and the answer comes from the second call.
      if (!r.failed && r.done?.need && prep.lookup) {
        const next = await prep.lookup(r.done.need).catch(() => null);
        if (next) {
          live.restart();
          gate = next.gate;
          r = await call(source, question, next.prompt, gate, true, o.tap === true);
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
      if (failed === 'gated' && dropped.some((rule) => BODY_RULES.has(rule))) {
        // Every sentence dropped and at least one by a body rule (T117, KC11.2): it was a reply about him, so the phone's
        // own refusal, stored the same way (no Retry, not counted, no taps), in the failed line's place on a Retry.
        const id = replaces?.id ?? ids('M');
        await store.chat.put(row(id, at, 'stylist', t('ask.refuseFace'), {}, { askRefused: true }));
        live.clear();
        deps.reportOnline?.();
        deps.onPosted?.(t('ask.refuseFace'));
        log('refused · emptied by the body rules');
        return { kind: 'answered', messageId: id, counted: false };
      }
      if (failed === 'paused') {
        // The server's spend stop (C6): its own line, no Retry (it would only be paused again), nothing counted.
        const id = replaces?.id ?? ids('M');
        await store.chat.put(row(id, at, 'stylist', t('ask.paused'), {}, { askPaused: true }));
        live.clear();
        deps.onPosted?.(t('ask.paused'));
        log('paused');
        return { kind: 'failed', messageId: id, code: 'paused' };
      }
      if (failed === 'limit') {
        // The server's daily limit (13 §8, A7): the same limit line as the phone's own, in the failed line's place.
        if (replaces) await store.chat.delete(replaces.id);
        live.clear();
        const lineId = await limitLine(at - 1);
        log('limit · the server');
        return { kind: 'failed', messageId: lineId, code: 'limit' };
      }
      if (failed || !done) {
        const id = replaces?.id ?? ids('M');
        // No connection (G18.4): said so, with the same Retry; nothing counted either way.
        const offline = failed === 'offline' && (await (deps.confirmOffline?.() ?? Promise.resolve(true)).catch(() => true));
        const text = t(offline ? 'fail.askOffline' : 'fail.ask');
        await store.chat.put(row(id, at, 'stylist', text, {}, { askRetry: question.id }));
        live.clear();
        deps.onPosted?.(text);
        log(`failed · ${failed}`);
        return { kind: 'failed', messageId: id, code: failed ?? 'noDone' };
      }
      deps.reportOnline?.();
      const counted = done.refused !== true && done.uncounted !== true && !o.tap;
      const id = ids('M');
      const clash = verdictClash(prep.verdict, done.verdict);
      if (clash) log('gate · verdict');
      const card = done.refused || clash || !prep.card ? null : await prep.card(done.card, gate).catch(() => null);
      // 0 to 3 follow-up taps (KC1.3): never under a refusal, a clash, or a tap question (two rows of taps).
      const followUps = done.refused || clash || card?.type === 'ask' ? [] : checkFollowUps(done.followUps, { question: question.text ?? '', gate });
      const saved = done.refused || !prep.remember ? null : await prep.remember(done.remember, at).catch(() => null);
      // KC1.1: cut at a sentence end (40 words with a drawn card, 60 without); the card is known only now, after the words streamed.
      const shown = cutAnswer(answer, !!card && DRAWN_CARD_TYPES.has(card.type));
      // The live row keeps showing the words until the thread has this row (live.ts).
      live.finish(id, shown, at, question.id);
      if (replaces) await store.chat.delete(replaces.id);
      await store.chat.put(row(id, at, 'stylist', shown, {}, {
        answerTo: question.id, ...(done.refused ? { askRefused: true as const } : {}), ...(card ? { askCard: card } : {}),
        ...(followUps.length ? { followUps } : {}),
        ...(saved ? { savedFact: saved.factId, ...(saved.itemId ? { savedPiece: saved.itemId } : {}) } : {}),
      }));
      if (counted) {
        await quota.consumeQuestion();
        await store.chat.patch(question.id, { payload: { ...question.payload, counts: true } });
      }
      log(`${counted ? 'answered · counted' : done.refused ? 'answered · refused' : o.tap ? 'answered · a tap' : 'answered · not counted'}${prep.kind ? ` · ${prep.kind}` : ''}${card ? ` · card ${card.type}` : ''}${saved ? ' · saved' : ''}`);
      // Read once, complete, with its card and the saved line (07 §6.1, P2).
      const spoken = [shown, prep.speak?.(card) ?? null, saved ? t('ask.saved') : null].filter(Boolean).join(' ');
      deps.onAnswered?.(spoken.endsWith('.') || spoken.endsWith('?') ? spoken : `${spoken}.`);
      await deps.afterAnswer?.({ kind: prep.kind ?? null, at, refused: done.refused === true, uncounted: done.uncounted === true }).catch((e: unknown) => log(`afterAnswer failed · ${String(e)}`));
      return { kind: 'answered', messageId: id, counted };
    } finally {
      busy = false;
    }
  }

  /**
   * One question at a time, claimed before the first await (07 §17, U2): a double tap on send, a chip, Retry or a tap
   * answer used to pass the busy check twice while the first was still awaiting consent and the limit, and sent twice.
   * `run` hands the question to `go` (the stream, which keeps the claim until it's done) or returns without it.
   */
  async function claimed(run: (go: typeof stream) => Promise<AskOutcome>): Promise<AskOutcome> {
    if (busy || live.inFlight()) return { kind: 'busy' };
    busy = true;
    let streaming = false;
    try {
      return await run((...a) => {
        streaming = true;
        return stream(...a);
      });
    } finally {
      if (!streaming) busy = false;
    }
  }

  return {
    /** Busy: a question is in flight (the composer's send waits). */
    get busy() {
      return busy;
    },

    async ask(input: string): Promise<AskOutcome> {
      const text = input.trim().slice(0, QUESTION_MAX_CHARS).trim();
      if (!text) return { kind: 'empty' };
      const now = clock.nowMs();
      const bubble = () => row(ids('M'), now, 'user', text);
      if (isDistress(text)) {
        const q = bubble();
        await store.chat.put(q);
        await store.chat.put(row(ids('M'), now + 1, 'stylist', t('support.text'), { kind: 'card', cardType: 'support' }));
        deps.onPosted?.(t('support.text'));
        log('support');
        return { kind: 'support', questionId: q.id };
      }
      if (isBodyRating(text)) {
        const q = bubble();
        await store.chat.put(q);
        await store.chat.put(row(ids('M'), now + 1, 'stylist', t('ask.refuseFace'), {}, { askRefused: true }));
        deps.onPosted?.(t('ask.refuseFace'));
        log('refused · on the phone');
        return { kind: 'refused', questionId: q.id };
      }
      // Under 18 (#311): the onboarding's own line, nothing sent, not counted. The app never stores his age.
      if (isUnderage(text)) {
        const q = bubble();
        await store.chat.put(q);
        await store.chat.put(row(ids('M'), now + 1, 'stylist', t('onb.age.title'), {}, { askRefused: true }));
        deps.onPosted?.(t('onb.age.title'));
        log('refused · under 18, on the phone');
        return { kind: 'refused', questionId: q.id };
      }
      return claimed(async (go) => {
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
        return { kind: 'sent', questionId: q.id, done: go(q, null) };
      });
    },

    /**
     * An ask card's answer (R6): his tap becomes his reply and the stylist answers it, never counted (a tap on its own
     * question isn't a new question, 07 §6.2), so it works at the daily limit too. The card keeps the answer he picked.
     */
    async tap(cardMessageId: string, option: string): Promise<AskOutcome> {
      const card = await store.chat.get(cardMessageId);
      const c = card?.payload.askCard as AskCard | undefined;
      if (!card || !c || c.type !== 'ask' || !c.options.includes(option) || typeof card.payload.askTapped === 'string') return { kind: 'empty' };
      return claimed(async (go) => {
        if (!(await deps.consent())) {
          deps.openConsent();
          return { kind: 'consent' };
        }
        if (!online()) return { kind: 'offline' };
        await store.chat.patch(card.id, { payload: { ...card.payload, askTapped: option } });
        const q = row(ids('M'), Math.max(clock.nowMs(), card.createdAt + 1), 'user', option, {}, { tapOf: card.id });
        await store.chat.put(q);
        return { kind: 'sent', questionId: q.id, done: go(q, null, { tap: true }) };
      });
    },

    /** fail.ask's Retry: the same question again, into the failed line's place. Null when there's nothing to retry. */
    async retry(failedId: string): Promise<AskOutcome | null> {
      const failed = await store.chat.get(failedId);
      const qid = typeof failed?.payload.askRetry === 'string' ? failed.payload.askRetry : null;
      const q = qid ? await store.chat.get(qid) : null;
      if (!failed || !q) return null;
      return claimed(async (go) => {
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
        return { kind: 'sent', questionId: q.id, done: go(q, failed, { tap: typeof q.payload.tapOf === 'string' }) };
      });
    },
  };
}

export type AskService = ReturnType<typeof createAsk>;
