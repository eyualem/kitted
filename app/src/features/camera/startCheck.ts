// One way into a check from any photo source (camera, library, sample sheet): start it and,
// when nothing was sent, say why in a toast (02 S3 copy). A check that started shows its card.
import { router } from 'expo-router';
import { store } from '@/data/db';
import { normStyleKey, OCCASIONS, type OccasionKey, type StyleKey } from '@/data/types';
import { fitCheck } from '@/features/fitcheck/session';
import type { CheckMode } from '@/features/fitcheck/machine';
import { snapFailedKey, snapPart } from '@/features/fitcheck/finish';
import type { StartOutcome } from '@/features/fitcheck/service';
import { showToast } from '@/features/toast/toast';
import { discardTempPhoto } from '@/services/tempPhoto';
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
  // Another check is still going: this photo waits its turn (#371), and he's told it wasn't lost.
  if (fitCheck.busy()) showToast(t('cam.waits'));
  // The service never throws (it fails the row instead); this catch is the last net for callers that `void` it.
  const r = await fitCheck.start({ mode, parentCheckId, ...lens, ...photo }).catch((e: unknown): StartOutcome => {
    console.error('[check] start threw', e);
    return { outcome: 'error' };
  });
  if (r.outcome === 'noConsent') {
    // His photo waits for the agreement instead of being dropped: "Agree" scores this same photo (no trip back
    // to the camera); closing the sheet discards it. The camera asks before a photo, so this is the rare path.
    askConsentThen(() => startCheck(mode, photo, parentCheckId, lens), () => {
      if ('photoUri' in photo) discardTempPhoto(photo.photoUri);
    });
    return r;
  }
  const snapFail = mode === 'shoeSnap' && parentCheckId ? await snapFailure(parentCheckId, r.outcome) : null;
  if (snapFail) showToast(t(snapFail));
  else explain(r);
  // Refused because another photo already waits its turn (09-ui-review §11 K2), or dropped while it waited (a reset,
  // #371): prep never ran, so nothing else would delete his temporary original.
  if ((r.outcome === 'busy' || r.outcome === 'dropped') && 'photoUri' in photo) discardTempPhoto(photo.photoUri);
  if (__DEV__) void logResult(mode, photo, r).catch(() => {});
  return r;
}

/** S19 "Try again" with the same toasts as a new check (the daily limit, an error before the card). */
export async function retryCheck(checkId: string): Promise<StartOutcome> {
  const r = await fitCheck.retry(checkId).catch((e: unknown): StartOutcome => {
    console.error('[check] retry threw', e);
    return { outcome: 'error' };
  });
  if (r.outcome === 'noConsent') {
    askConsentThen(() => retryCheck(checkId), () => {});
    return r;
  }
  explain(r);
  return r;
}

/** A snap that didn't read (02 S9): "Couldn't read your shoes…" (or the pants and shoes, #313); the Finish row stays. */
async function snapFailure(parentCheckId: string, outcome: StartOutcome['outcome']) {
  const parent = await store.fitChecks.get(parentCheckId).catch(() => null);
  return parent ? snapFailedKey(outcome, snapPart(parent)) : null;
}

/** S17h "Score it" on a held photo (#281): read and scored now, on today's free check, with the same toasts as a new
 *  check (consent, an error before the card). */
export async function scoreHeldPhoto(checkId: string): Promise<StartOutcome> {
  const r = await fitCheck.scoreHeldNow(checkId).catch((e: unknown): StartOutcome => {
    console.error('[check] held score threw', e);
    return { outcome: 'error' };
  });
  if (r.outcome === 'noConsent') {
    askConsentThen(() => scoreHeldPhoto(checkId), () => {});
    return r;
  }
  explain(r);
  return r;
}

/** What runs once he agrees on the consent sheet (a photo he already picked, or a Try again), and what to do if he
 *  doesn't. One at a time: a newer one replaces (and drops) the older. */
let pending: { run: () => Promise<unknown>; drop: () => void } | null = null;

function askConsentThen(run: () => Promise<unknown>, drop: () => void): void {
  pending?.drop();
  pending = { run, drop };
  router.push('/sheets/consent?resume=1');
}

/** The consent sheet's "Agree": starts what was waiting. False when nothing was. */
export function resumeAfterConsent(): boolean {
  const p = pending;
  pending = null;
  if (!p) return false;
  void p.run();
  return true;
}

/** The consent sheet closed without agreeing: what was waiting is dropped (his temporary photo goes). */
export function dropAfterConsent(): void {
  pending?.drop();
  pending = null;
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
    // A re-check or Try again past its limit, or Pro's daily cap. A new photo over the free limit is held instead
    // ('held'): its Limit card in the thread is the answer (02 D19 S17, #280), no toast.
    showToast(t('stylist.quota.used'));
  } else if (r.outcome === 'noConsent') {
    // "Score my fits" went off mid-way ("Which one is you?"): nothing was sent. He re-agrees, never silently; agreeing
    // just closes the sheet (`resume` with nothing waiting), and he taps his photo again.
    router.push('/sheets/consent?resume=1');
  } else if (r.outcome === 'error' && !('checkId' in r)) {
    // No card was posted (prep or a write failed first): say it didn't count. With a card, the card says so.
    showToast(t('fail.ai'));
  }
  else if (r.outcome === 'noParent') {
    // A re-check, snap or retry whose first check is gone (deleted meanwhile): the camera closed with nothing said (R7).
    showToast(t('cam.noParent'));
  }
  else if (r.outcome === 'busy') {
    // Another photo already waits its turn (§1 item 7, #233 item 8, #371): this one isn't sent or counted, and he's told.
    showToast(t('cam.busy'));
  }
  // 'whichOne': the question card in the thread is the answer. 'held': the Limit card is. 'dropped': he reset or
  // deleted his data meanwhile; there's nothing to say.
}
