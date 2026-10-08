// The words for each tip and after-shot reason (DECISIONS-LOG #100). Copy: i18n/en.ts.
import { t, type StringKey } from '@/i18n/en';
import type { FitTip, Issue, ScanTip } from './guidance';

export type TipIcon = 'checkFilled' | 'warning' | null;

const FIT: Record<FitTip, StringKey> = {
  dark: 'cam.tip.dark', darkFlash: 'cam.tip.darkFlash', noPerson: 'cam.tip.noPerson', mirrorAim: 'cam.tip.mirrorAim', backlit: 'cam.tip.backlit',
  tooClose: 'cam.tip.tooClose', tooFar: 'cam.tip.tooFar', moveLeft: 'cam.tip.moveLeft', moveRight: 'cam.tip.moveRight', moving: 'cam.tip.moving',
  good: 'cam.tip.good', goodFull: 'cam.tip.goodFull',
};

export function fitTipCopy(tip: FitTip): { text: string; icon: TipIcon } {
  const icon: TipIcon = tip === 'good' || tip === 'goodFull' ? 'checkFilled' : tip === 'dark' || tip === 'backlit' || tip === 'noPerson' ? 'warning' : null;
  return { text: t(FIT[tip]), icon };
}

const SCAN: Record<Exclude<ScanTip, 'good'>, StringKey> = {
  looking: 'scan.tip.looking', dark: 'scan.tip.dark', darkTorch: 'scan.tip.darkTorch', person: 'scan.tip.person', noClothes: 'scan.tip.noClothes',
  moving: 'cam.tip.moving', glare: 'scan.tip.glare', cutOff: 'scan.tip.cutOff', tooFar: 'scan.tip.tooFar',
};

export function scanTipCopy(tip: ScanTip, count: number): { text: string; icon: TipIcon } {
  if (tip === 'good') return { text: count === 1 ? t('scan.tip.good1') : t('scan.tip.good', { n: count }), icon: 'checkFilled' };
  const icon: TipIcon = tip === 'dark' || tip === 'darkTorch' || tip === 'person' || tip === 'noClothes' ? 'warning' : null;
  return { text: t(SCAN[tip]), icon };
}

/** Problem tips worth saying out loud in Propped (he's 2–3 m away). */
export function isSpokenTip(tip: FitTip): boolean {
  return tip !== 'good' && tip !== 'goodFull';
}

const FIT_TITLE: Partial<Record<Issue['reason'], StringKey>> = {
  dark: 'cam.retake.dark', blurry: 'cam.retake.blurry', backlit: 'cam.retake.backlit', noPerson: 'cam.retake.noPerson', cantFrame: 'cam.retake.cantFrame',
};
const SCAN_TITLE: Partial<Record<Issue['reason'], StringKey>> = {
  dark: 'scan.retake.dark', blurry: 'cam.retake.blurry', person: 'scan.retake.person', cantHide: 'scan.retake.cantHide', noClothes: 'scan.retake.noClothes',
  cutOff: 'scan.retake.cutOff', glare: 'scan.retake.glare',
};

export function issueTitle(issue: Issue, kind: 'fit' | 'scan'): string {
  const key = (kind === 'fit' ? FIT_TITLE : SCAN_TITLE)[issue.reason] ?? 'cam.retake.cantFrame';
  return t(key);
}
