// T69-G9: the score words cover 3 to 9.5 in six bands (parts v16 scores 3.0-9.5 with no floor). The word comes from
// the score rounded to the half, as today; the 3-4.5 word is the founder's "Start fresh" (Q-W1, Nov 17), copy key
// score.word.redo. No 10 anywhere.
import { scoreBandIndex, scoreWord, scoreWordLabel } from '@/design-system/score';
import { scoreBands, scoreMax } from '@/design-system/tokens';
import { en, t, type StringKey } from '@/i18n/en';

describe('the score words (T69-G9)', () => {
  it('T69-G9 · six bands from the rounded score', () => {
    expect(scoreBands).toEqual([
      { min: -Infinity, word: 'Redo', label: '3–4.5' },
      { min: 5.0, word: 'Needs a fix', label: '5–5.5' },
      { min: 6.0, word: 'Getting there', label: '6–6.5' },
      { min: 7.0, word: 'Put together', label: '7–7.5' },
      { min: 8.0, word: 'Sharp', label: '8–8.5' },
      { min: 9.0, word: 'Dialed in', label: '9–9.5' },
    ]);
    expect(scoreBands.length).toBe(6);
    expect(scoreMax).toBe(9.5);
    const cases: [number, string, number][] = [
      [3.0, 'Redo', 0], [3.5, 'Redo', 0], [4.0, 'Redo', 0], [4.5, 'Redo', 0],
      [5.0, 'Needs a fix', 1], [5.5, 'Needs a fix', 1],
      [6.0, 'Getting there', 2], [6.5, 'Getting there', 2],
      [7.0, 'Put together', 3], [7.5, 'Put together', 3],
      [8.0, 'Sharp', 4], [8.5, 'Sharp', 4],
      [9.0, 'Dialed in', 5], [9.5, 'Dialed in', 5],
      // from the ROUNDED score: 4.74 shows 4.5, 4.75 shows 5.0
      [4.74, 'Redo', 0], [4.75, 'Needs a fix', 1],
    ];
    for (const [x, word, i] of cases) expect([x, scoreWord(x), scoreBandIndex(x)]).toEqual([x, word, i]);
    // the shown word: the deck's key, the founder's word; a 3-4.5 never reads "Needs a fix"
    expect((en as Record<string, string>)['score.word.redo']).toBe('Start fresh');
    for (const x of [3.0, 3.5, 4.0, 4.5, 4.74]) {
      expect([x, scoreWordLabel(x)]).toEqual([x, t('score.word.redo' as StringKey)]);
      expect([x, scoreWordLabel(x)]).toEqual([x, 'Start fresh']);
    }
    expect(scoreWordLabel(5.0)).toBe('Needs a fix');
    expect(scoreWordLabel(9.5)).toBe('Dialed in');
    // the scale's labels name no 10
    expect(scoreBands.some((b) => /10/.test(b.label))).toBe(false);
  });
});
