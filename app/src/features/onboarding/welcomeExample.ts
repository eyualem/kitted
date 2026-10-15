// O1's mini score card (02 D1): the example check on the s15 hero photo, scored by the engine new checks use, so the
// first screen shows the score the app would give that photo (#276: it said 8.5 "Sharp" while the app scored it 8.0).
// Same photo, same score. Scored at Everyday with no picks (picks never change a score, #211).
import { overallFor, scoreOptions } from '@/features/fitcheck/scoring';
import { scoreWordLabel } from '@/design-system/score';
import { demoReadingById } from '@/services/readingSource/demoReadings';

export const WELCOME_PHOTO = 's15';

export function welcomeExample(): { score: number; word: string } | null {
  const reading = demoReadingById(WELCOME_PHOTO);
  const score = reading ? overallFor(reading, scoreOptions({ occasion: 'everyday', styles: [], boldness: null })) : null;
  return score === null ? null : { score, word: scoreWordLabel(score) };
}
