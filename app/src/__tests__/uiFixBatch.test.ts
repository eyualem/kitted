// The UI fix batch (#276): the re-check summary is honest about which way the score went, its new problems are said in
// words, the Welcome card's example score is the engine's, closet names read mid-sentence in fix lines, and the parts
// strip prints one decimal.
import { scoreParts } from '@kitted/core';
import { newProblemLines, recheckMove, recheckSummary } from '@/features/fitcheck/explain';
import { midSentenceNames, overallFor, scoreOptions } from '@/features/fitcheck/scoring';
import { WELCOME_PHOTO, welcomeExample } from '@/features/onboarding/welcomeExample';
import { partText } from '@/features/why/partsRows';
import { demoReadingById } from '@/services/readingSource/demoReadings';
import { scoreWordLabel } from '@/design-system/score';

const layered = [{ target: 'wear_held', engine: 'parts' as const, earned: 1 }];

describe('re-check summary (#276)', () => {
  it('only a win with no new problem says "Nothing else changed."', () => {
    expect(recheckMove(8, 9)).toBe('up');
    expect(recheckMove(8, 8)).toBe('same');
    expect(recheckMove(8, 7.5)).toBe('down');
    expect(recheckSummary({ after: 9, doneFixes: layered as never }, 'up', [])).toEqual({ lead: 'Layered and clean.', word: 'Dialed in.', tail: 'Nothing else changed.' });
    expect(recheckSummary({ after: 8.5, doneFixes: layered as never }, 'up', ['the overshirt hides the tuck'])).toEqual({ lead: '', word: 'Sharp.', tail: '' });
    expect(recheckSummary({ after: 7.5, doneFixes: layered as never }, 'down', [])).toEqual({ lead: '', word: 'Put together.', tail: '' });
    expect(recheckSummary({ after: 8, doneFixes: [] }, 'same', [])).toEqual({ lead: '', word: 'Sharp.', tail: '' });
  });

  it('new problems are worded from the re-check\'s own parts reasons, condition faults and v4 rule names', () => {
    const r = demoReadingById('p01a')!;
    const res = scoreParts(r, { occasion: 'everyday', styles: [], boldness: 'a_little' });
    if (res.overall === null) throw new Error('p01a unscored');
    const parts = (res as unknown as { parts: Record<string, { reasons: { check: string; points: number; line: string }[] }> }).parts;
    const fault = Object.entries(parts).flatMap(([k, p]) => p.reasons.filter((x) => x.points < 0).map((x) => ({ id: `${k}:${x.check}`, line: x.line })))[0];
    const details = { parts: res as never };
    if (fault) expect(newProblemLines([fault.id], details)).toEqual([fault.line]);
    expect(newProblemLines(['condition:the tee looks wrinkled'], details)).toEqual(['the tee looks wrinkled']);
    expect(newProblemLines(['F6_top_too_long'], {})).toEqual(['top runs long']);
    expect(newProblemLines(['fit:NOPE', 'NOT_A_RULE'], details)).toEqual([]);
  });
});

describe('the Welcome card (#276)', () => {
  it('shows the score the app gives the s15 photo, with its word', () => {
    const ex = welcomeExample()!;
    const expectedScore = overallFor(demoReadingById(WELCOME_PHOTO)!, scoreOptions({ occasion: 'everyday', styles: [], boldness: null }));
    expect(ex.score).toBe(expectedScore);
    expect(ex.word).toBe(scoreWordLabel(ex.score));
    // The card says "Full check": the example must be one.
    const scored = scoreParts(demoReadingById(WELCOME_PHOTO)!, { occasion: 'everyday', styles: [], boldness: 'a_little' }) as unknown as { partial: boolean };
    expect(scored.partial).toBe(false);
  });
});

describe('small fixes (#276)', () => {
  it('closet names read mid-sentence after "your"', () => {
    const closet = [{ id: 'C1', name: 'Khaki chinos', slot: 'bottom', garment: {} }, { id: 'C2', name: 'grey hoodie', slot: 'top', garment: {} }] as never;
    expect(midSentenceNames('Swap to your Khaki chinos', closet)).toBe('Swap to your khaki chinos');
    expect(midSentenceNames('Wearing your Khaki chinos lifts Style', closet)).toBe('Wearing your khaki chinos lifts Style');
    expect(midSentenceNames('Khaki chinos are fine', closet)).toBe('Khaki chinos are fine');
  });

  it('the parts strip prints one decimal', () => {
    expect([partText(7), partText(7.5), partText(null)]).toEqual(['7.0', '7.5', '—']);
  });
});
