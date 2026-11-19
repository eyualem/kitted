// T115 · KC1.3 (taps about clothes) under the hard line: a follow-up tap is sent as his own message, so a tap where he
// is the subject of look/seem/feel/am stays only with a clothes verdict ("Do I look good in this coat?" stays, "Do I
// look chunky in this coat?" goes). Written before the code (tasks/T115/TESTING.md). Each tap is checked alone, under
// an unrelated question, with a gate that allows no score.
import { checkFollowUps } from '@/features/ask/cards';

const QUESTION = 'What should I wear tonight?';
const check = (tap: string) => checkFollowUps([tap], { question: QUESTION, gate: { allowedScores: new Set<string>() } });

describe('KC1.3-T1 · taps where he is the subject of look/seem/feel/am keep only a clothes verdict', () => {
  it.each([
    'Do I look chunky in this coat?',
    'Do I look 30 in this jacket?',
    'Do I look manly in this coat?',
    'Do I look girly in this top?',
    'Do I look gay in this shirt?',
    'Do I look old in this jacket?',
    'Do I look young in this tee?',
    'I feel fat in this shirt',
    'Am I too big for this shirt?',
    'Do I seem short in boots?',
    'I look pale in this sweater',
    'Do I look stocky in this coat?',
    'Muffin top in my jeans?',
  ])('KC1.3-T1 · drops "%s"', (tap) => {
    expect(check(tap)).toEqual([]);
  });
});

describe('KC1.3-T2 · clothes-verdict taps stay', () => {
  it.each([
    'Do I look ok in this shirt?',
    'Do I look good in this coat?',
    'Am I dressed right for it?',
    'Am I overdressed in a blazer?',
    // The plan's "Do I look too formal in a suit?" is 31 characters, which KC1.3 itself drops ("at most 30
    // characters"); the same clothes verdict at 30 characters tests the allowlist instead of the length rule.
    'Do I look too formal in suits?',
    'Am I warm enough in this coat?',
    'Do my boots look ok?',
    'Is my hoodie too big?',
    'What should I buy first?',
    'Show me tall boots',
  ])('KC1.3-T2 · keeps "%s"', (tap) => {
    expect(check(tap)).toEqual([tap]);
  });
});
