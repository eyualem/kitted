// One way into a check from any photo source (camera, library, sample sheet): start it and,
// when nothing was sent, say why in a toast (02 S3 copy). A check that started shows its card.
import { router } from 'expo-router';
import { store } from '@/data/db';
import { normStyleKey, OCCASIONS, type OccasionKey, type StyleKey } from '@/data/types';
import { fitCheck } from '@/features/fitcheck/session';
import type { CheckMode } from '@/features/fitcheck/machine';
import type { StartOutcome } from '@/features/fitcheck/service';
import { showToast } from '@/features/toast/toast';
import { t } from '@/i18n/en';

export type PhotoInput = { photoId: string } | { photoUri: string };

/** What the check is scored for when it starts from the morning/evening card (#61); else defaults. */
export interface CheckLens {
  occasion?: OccasionKey;
  style?: StyleKey | null;
}

/** Reads `occasion` / `style` route params (strings) into a lens, ignoring anything unknown. */
export function lensFromParams(p: { occasion?: string; style?: string }): CheckLens {
  const lens: CheckLens = {};
  if (p.occasion && (OCCASIONS as readonly string[]).includes(p.occasion)) lens.occasion = p.occasion as OccasionKey;
  const style = normStyleKey(p.style);
  if (style) lens.style = style;
  return lens;
}

/** The same params as a query string tail ("&occasion=date&style=streetwear"), to pass through. */
export function lensQuery(lens: CheckLens): string {
  return `${lens.occasion ? `&occasion=${lens.occasion}` : ''}${lens.style ? `&style=${lens.style}` : ''}`;
}

export async function startCheck(mode: CheckMode, photo: PhotoInput, parentCheckId?: string, lens: CheckLens = {}): Promise<StartOutcome> {
  // The service never throws (it fails the row instead); this catch is the last net for callers that `void` it.
  const r = await fitCheck.start({ mode, parentCheckId, ...lens, ...photo }).catch((e: unknown): StartOutcome => {
    console.error('[check] start threw', e);
    return { outcome: 'error' };
  });
  explain(r);
  if (__DEV__) void logResult(mode, photo, r).catch(() => {});
  return r;
}

/** S19 "Try again" with the same toasts as a new check (the daily limit, an error before the card). */
export async function retryCheck(checkId: string): Promise<StartOutcome> {
  const r = await fitCheck.retry(checkId).catch((e: unknown): StartOutcome => {
    console.error('[check] retry threw', e);
    return { outcome: 'error' };
  });
  explain(r);
  return r;
}

/** DEV: one readable line per check in the Metro log, so a test on his phone can be followed
 *  from the Mac (05 §P3: on-phone checklist). Never in Release. */
async function logResult(mode: CheckMode, photo: PhotoInput, r: StartOutcome) {
  const src = 'photoId' in photo ? `sample ${photo.photoId}` : 'his photo';
  if (!('checkId' in r)) {
    console.log(`[check] ${mode} · ${src} → ${r.outcome}${'reason' in r ? ` (${r.reason})` : ''} · nothing sent`);
    return;
  }
  const row = await store.fitChecks.get(r.checkId);
  const reading = row?.readingId ? await store.readings.get(row.readingId) : null;
  const pieces = (reading?.reading.garments ?? []).map((g) => `${g.color_family} ${g.subcategory}`).join(', ');
  console.log(
    `[check] ${mode} · ${src} → ${r.outcome} · score ${row?.score ?? '–'}${row?.isPartial ? ' (partial)' : ''} · ${reading?.model ?? '?'} ${((reading?.latencyMs ?? 0) / 1000).toFixed(1)} s` +
      `\n        read: ${pieces || '–'}` +
      `\n        fixes: ${(row?.fixes ?? []).map((f) => `${f.copy} → ${f.to}`).join(' | ') || 'none'}` +
      (row?.details.failCode ? `\n        failed: ${row.details.failCode}` : ''),
  );
}

/** "Which one is you?" (02 S23): he tapped himself; the check starts with everyone else covered in what's sent. */
export async function pickPerson(messageId: string, index: number): Promise<StartOutcome | null> {
  const r = await fitCheck.pickPerson(messageId, index).catch((e: unknown): StartOutcome => {
    console.error('[check] pick threw', e);
    return { outcome: 'error' };
  });
  if (r) explain(r);
  if (__DEV__ && r) console.log(`[check] which one is you → person ${index + 1} · ${r.outcome}`);
  return r;
}

/** "Which one is you?" → Cancel: nothing was sent and nothing counts. */
export async function cancelWhichOne(messageId: string): Promise<void> {
  const done = await fitCheck.dismissWhichOne(messageId).catch(() => false);
  if (__DEV__ && done) console.log('[check] which one is you → cancelled · nothing sent');
}

export function explain(r: StartOutcome) {
  if (r.outcome === 'photoProblem') {
    showToast(r.reason === 'noPerson' ? t('cam.retake.noPerson') : r.reason === 'multiplePeople' ? t('whichOne.q') : t('cam.retake.cantFrame'));
  } else if (r.outcome === 'unknownPhoto' || r.outcome === 'notImplemented') {
    showToast(t('demo.unknownPhoto'));
  } else if (r.outcome === 'limit') {
    showToast(t('stylist.quota.used'));
  } else if (r.outcome === 'noConsent') {
    // "Score my fits" is off (Y7): nothing was prepped or sent. He re-agrees on the consent sheet, never silently.
    router.push('/sheets/consent');
  } else if (r.outcome === 'error' && !('checkId' in r)) {
    // No card was posted (prep or a write failed first): say it didn't count. With a card, the card says so.
    showToast(t('fail.ai'));
  }
  // 'busy' (another photo is still being read) has no words yet: the reading card on screen is the answer.
  // 'whichOne': the question card in the thread is the answer.
}
