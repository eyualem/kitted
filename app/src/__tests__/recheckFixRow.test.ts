// 09-ui-review §6.5 (#280), written before the build: the caught fix's row on a re-check says the pill's number, in
// the pill's format.
import { caughtFixGain } from '@/features/fitcheck/explain';
import { deltaPill } from '@/i18n/format';

const one = [{ copy: 'Wear the overshirt, open', earned: 1 }];

describe('the re-check fix row (§6.5)', () => {
  test('N1: a caught fix row on a re-check shows the same number, formatted the same way, as the pill ("+1.0", not "+1")', () => {
    // The pill's format: one decimal, always.
    expect(deltaPill(1)).toBe('+1.0');
    expect(deltaPill(0.5)).toBe('+0.5');
    expect(deltaPill(1.5)).toBe('+1.5');
    for (const [was, now] of [[8, 9], [7, 7.5], [6.5, 8], [7.5, 9.5]] as const) {
      expect(caughtFixGain({ parentScore: was, doneFixes: one }, now)).toBe(deltaPill(now - was));
    }
    expect(caughtFixGain({ parentScore: 8, doneFixes: one }, 9)).toBe('+1.0');
    // Unchanged (#276): several caught fixes, or no win, carry no number on the rows.
    expect(caughtFixGain({ parentScore: 8, doneFixes: [...one, { copy: 'Tuck in your tee', earned: 0.5 }] }, 9)).toBe('');
    expect(caughtFixGain({ parentScore: 8, doneFixes: one }, 8)).toBe('');
    expect(caughtFixGain({ parentScore: 8, doneFixes: one }, 7.5)).toBe('');
  });
});
