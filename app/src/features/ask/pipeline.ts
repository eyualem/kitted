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
import { isBodyRating, isDistress } from './guards';
import { liveAnswer as defaultLive } from './live';
import type { AnswerEvent, AnswerSource } from './source';

export interface AskDeps {
  store: Pick<KittedStore, 'chat'>;
  quota: Pick<QuotaService, 'snapshot' | 'canAskQuestion' | 'consumeQuestion'>;
  clock: Clock;
  ids: (prefix: string) => string;
  /** Picked per question (the demo's seeded answers or "coming soon"; the real model from C2). */
  source: () => AnswerSource | Promise<AnswerSource>;
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

  async function stream(question: ChatMessage, replaces: ChatMessage | null): Promise<AnswerResult> {
    busy = true;
    live.start(question.id, replaces?.id ?? null);
    let text = '';
    let done: Extract<AnswerEvent, { type: 'done' }> | null = null;
    let failed: string | null = null;
    try {
      const source = await deps.source();
      for await (const ev of source.answer({ question: question.text ?? '' })) {
        if (ev.type === 'delta') {
          text += ev.text;
          live.append(ev.text);
        } else if (ev.type === 'done') {
          done = ev;
          break;
        } else {
          failed = ev.code;
          break;
        }
      }
    } catch {
      failed = 'threw';
    }
    const answer = text.trim();
    if (!failed && !done) failed = 'noDone';
    if (!failed && !answer) failed = 'empty';
    const at = replaces?.createdAt ?? Math.max(clock.nowMs(), question.createdAt + 1);
    try {
      if (failed || !done) {
        const id = replaces?.id ?? ids('M');
        await store.chat.put(row(id, at, 'stylist', t('fail.ask'), {}, { askRetry: question.id }));
        live.clear();
        log(`failed · ${failed}`);
        return { kind: 'failed', messageId: id, code: failed ?? 'noDone' };
      }
      const counted = done.refused !== true && done.uncounted !== true;
      const id = ids('M');
      // The live row keeps showing the words until the thread has this row (live.ts).
      live.finish(id, answer);
      if (replaces) await store.chat.delete(replaces.id);
      await store.chat.put(row(id, at, 'stylist', answer, {}, { answerTo: question.id, ...(done.refused ? { askRefused: true as const } : {}) }));
      if (counted) {
        await quota.consumeQuestion();
        await store.chat.patch(question.id, { payload: { ...question.payload, counts: true } });
      }
      log(counted ? 'answered · counted' : done.refused ? 'answered · refused' : 'answered · not counted');
      deps.onAnswered?.(answer);
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
      return { kind: 'sent', questionId: q.id, done: stream(q, failed) };
    },
  };
}

export type AskService = ReturnType<typeof createAsk>;
