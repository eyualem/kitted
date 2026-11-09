// What the Limit card (02 D19 S17), its saved state (S17h) and the after-4-am question say, from the held check and today's quota. Pure, so the
// card's words are tested without rendering it (#280). Copy from the deck (limit.*, held.*). On the beta (FP7) the card
// has its own words and one button, and never an upgrade, whatever the paywall's switch says.
import { paywallOn } from '@/features/paywall/switch';
import type { FitCheckRow } from '@/data/types';
import { t } from '@/i18n/en';
import { LIMITS, questionsLeft, type QuotaSnapshot } from '@/services/quota';

export interface LimitCardContent {
  /** 'limit': S17, just posted (or ignored); 'saved': S17h, after "Save for tomorrow". */
  state: 'limit' | 'saved';
  tag: string;
  tagRight: string;
  /** S17's headline; null on S17h. */
  title: string | null;
  body: string;
  /** "Save for tomorrow" (S17 only). */
  save: string | null;
  /** "Try Pro · 1 week free" / "Try Pro" (S17 only, once the paywall exists). */
  tryPro: string | null;
  /** "Don't score it" (S17h only). */
  dontScore: string | null;
  /** The card as one VoiceOver element. */
  a11y: string;
}

/** null when the check isn't held (it was scored, or he said Don't score it). */
export function limitCardContent(
  row: Pick<FitCheckRow, 'status' | 'details'>,
  quota: Pick<QuotaSnapshot, 'questionsUsed' | 'questionLimit' | 'recheckOpen' | 'tier'>,
  o: { paywallBuilt?: boolean; trialUsed?: boolean } = {},
): LimitCardContent | null {
  if (row.status !== 'held') return null;
  const beta = quota.tier === 'beta';
  if (row.details.held?.saved) {
    const body = t(beta ? 'held.body.beta' : 'held.body');
    return {
      state: 'saved', tag: t('held.tag'), tagRight: t('held.tagWhen'), title: null, body, save: null, tryPro: null, dontScore: t('held.dontScore'),
      a11y: `${t('held.tag')}. ${t('held.tagWhen')}. ${body}`,
    };
  }
  if (beta) {
    // FP7 gives the body exactly: no questions-left or re-check sentence, and one button.
    const title = t('limit.beta.title', { n: LIMITS.betaChecks });
    const body = t('limit.beta.body');
    return {
      state: 'limit', tag: t('limit.tag'), tagRight: t('limit.resets'), title, body, save: t('limit.save'), tryPro: null, dontScore: null,
      a11y: `${t('limit.tag')}. ${title} ${body}`,
    };
  }
  const left = questionsLeft(quota);
  const base = left > 0 ? t('limit.body', { n: left }) : t('limit.bodyNoQuestions');
  const body = quota.recheckOpen ? `${base} ${t('limit.recheckStill')}` : base;
  const tryPro = (o.paywallBuilt ?? paywallOn()) ? t(o.trialUsed ? 'limit.proNoTrial' : 'limit.pro') : null;
  return {
    state: 'limit', tag: t('limit.tag'), tagRight: t('limit.resets'), title: t('limit.title'), body, save: t('limit.save'), tryPro, dontScore: null,
    a11y: `${t('limit.tag')}. ${t('limit.title')} ${body}`,
  };
}

export interface HeldReadyContent {
  text: string;
  score: string;
  notThis: string;
}

/** S17h after 4 am: "Ready to score last night's photo?" with Score it / Not this one, while the photo is still held
 *  and he's been asked (offerHeld); null once it's scored or gone. */
export function heldReadyContent(row: Pick<FitCheckRow, 'status' | 'details'> | null | undefined): HeldReadyContent | null {
  if (!row || row.status !== 'held' || row.details.held?.offeredAt === undefined) return null;
  return { text: t('held.ready'), score: t('held.score'), notThis: t('held.notThis') };
}
