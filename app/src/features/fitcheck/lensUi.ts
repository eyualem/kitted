// The result card's "what it was scored for" (02 "S6s", DECISIONS-LOG #61–62): the confirm alert
// before a re-score, and the plain-words line that appears only when the style changed something.
import { Alert, Platform } from 'react-native';
import { styleEffects, type StyleEffect } from '@kitted/core';
import { store } from '@/data/db';
import type { FitCheckRow, OccasionKey, StyleKey } from '@/data/types';
import { useLive } from '@/data/useLive';
import { displayScore } from '@/design-system';
import { t } from '@/i18n/en';
import { occasionLabel } from '@/features/stylist/thread';
import { styleLabel } from '@/features/morning/copy';
import { garmentLabel } from './labels';
import { fitCheck } from './session';

const MENU_DISMISS_MS = 450;

export type Lens = { occasion?: OccasionKey; style?: StyleKey | null };

/** After the score has landed, a change asks first, with the new score in the question (#62). */
export async function confirmLens(row: FitCheckRow, lens: Lens): Promise<void> {
  const preview = await fitCheck.previewLens(row.id, lens);
  if (!preview || preview.before === null) return;
  const choice = lens.occasion ? occasionLabel(lens.occasion) : styleLabel(lens.style ?? null);
  const current = lens.occasion ? occasionLabel(row.occasion) : styleLabel(row.style);
  const before = displayScore(preview.before);
  const msg = preview.after === null || preview.after === preview.before
    ? t('rescore.msgSame', { before })
    : t('rescore.msg', { before, after: displayScore(preview.after) });
  if (Platform.OS === 'web') {
    await fitCheck.changeLens(row.id, lens); // web preview: no native alert
    return;
  }
  // The pull-down is still animating closed when its item fires; iOS drops an alert presented
  // during that dismissal, so wait for it (the action sheet path is already closed by now).
  await new Promise((r) => setTimeout(r, MENU_DISMISS_MS));
  Alert.alert(t('rescore.title', { choice: choice.toLowerCase() }), msg, [
    { text: t('rescore.keep', { current: current.toLowerCase() }), style: 'cancel' },
    { text: t('rescore.go'), isPreferred: true, onPress: () => void fitCheck.changeLens(row.id, lens) },
  ]);
}

export interface ScoredFor {
  effects: StyleEffect[];
  /** The line under the summary, or null when the style changed nothing. */
  line: string | null;
  garmentNames: (string | null)[];
}

export function useScoredFor(row: FitCheckRow | null | undefined): ScoredFor | null {
  return useLive(
    ['fitChecks', 'readings', 'profile'],
    async () => {
      if (!row?.readingId || row.status !== 'scored' || !row.style) return null;
      const reading = (await store.readings.get(row.readingId))?.reading;
      if (!reading) return null;
      const p = await store.profile.get('me');
      const { effects } = styleEffects(reading, { occasion: row.occasion, style: row.style, boldness: p?.boldness ?? null });
      const names = effects.map((e) => {
        const g = e.culpritIndex !== null ? reading.garments[e.culpritIndex] : undefined;
        return g ? garmentLabel(g).toLowerCase() : null;
      });
      const first = effects[0];
      const style = styleLabel(row.style).toLowerCase();
      const line = !first
        ? null
        : names[0]
          ? t(first.withStyle < first.general ? 'scoredFor.off' : 'scoredFor.on', { style, garment: names[0] })
          : t('scoredFor.generic', { style });
      return { effects, line, garmentNames: names };
    },
    [row?.id, row?.readingId, row?.style, row?.occasion, row?.status],
  ) ?? null;
}
