// O1's mini score card (02 D1): the example check on the hero photo (s14 since #278: s15 scores 7.0, and no demo
// photo reaches 8 under the parts engine, so the highest, 7.5, leads; s14 over p01a, which has socks and no shoes), scored by the engine new checks use, so the
// first screen shows the score the app would give that photo (#276: it said 8.5 "Sharp" while the app scored it 8.0).
// Same photo, same score. Scored at Everyday with no picks (picks never change a score, #211).
import { overallFor, scoreOptions } from '@/features/fitcheck/scoring';
import { scoreWordLabel } from '@/design-system/score';
import { demoReadingById } from '@/services/readingSource/demoReadings';

export const WELCOME_PHOTO = 's14';

export function welcomeExample(): { score: number; word: string } | null {
  const reading = demoReadingById(WELCOME_PHOTO);
  const score = reading ? overallFor(reading, scoreOptions({ occasion: 'everyday', styles: [], boldness: null })) : null;
  return score === null ? null : { score, word: scoreWordLabel(score) };
}
