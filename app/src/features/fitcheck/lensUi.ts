// The result card's re-score (02 D7, DECISIONS-LOG #61–62): the confirm alert before an occasion change.
// (The "Scored for" line is gone: since rubric v4 a style never changes a score; the card says "Reads as …", #85.)
import { Alert, Platform } from 'react-native';
import type { FitCheckRow, OccasionKey, StyleKey } from '@/data/types';
import { displayScore } from '@/design-system';
import { t } from '@/i18n/en';
import { occasionLabel } from '@/features/stylist/thread';
import { styleLabel } from '@/features/morning/copy';
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
