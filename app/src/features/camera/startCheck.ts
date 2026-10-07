// One way into a check from any photo source (camera, library, sample sheet): start it and,
// when nothing was sent, say why in a toast (02 S3 copy). A check that started shows its card.
import { store } from '@/data/db';
import { fitCheck } from '@/features/fitcheck/session';
import type { CheckMode } from '@/features/fitcheck/machine';
import type { StartOutcome } from '@/features/fitcheck/service';
import { showToast } from '@/features/toast/toast';
import { t } from '@/i18n/en';

export type PhotoInput = { photoId: string } | { photoUri: string };

export async function startCheck(mode: CheckMode, photo: PhotoInput, parentCheckId?: string): Promise<StartOutcome> {
  const r = await fitCheck.start({ mode, parentCheckId, ...photo });
  explain(r);
  if (__DEV__) void logResult(mode, photo, r);
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

export function explain(r: StartOutcome) {
  if (r.outcome === 'photoProblem') {
    showToast(r.reason === 'noPerson' ? t('cam.retake.noPerson') : r.reason === 'multiplePeople' ? t('whichOne.q') : t('cam.retake.cantFrame'));
  } else if (r.outcome === 'unknownPhoto' || r.outcome === 'notImplemented') {
    showToast(t('demo.unknownPhoto'));
  } else if (r.outcome === 'limit') {
    showToast(t('stylist.quota.used'));
  }
}
