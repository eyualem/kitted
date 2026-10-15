// The phone's own checks before a question is sent (07 §7.2, 02 S27): narrow on purpose.
import { isBodyRating, isDistress, normalizeQuestion } from '@/features/ask/guards';

describe('normalizeQuestion', () => {
  it('lowercases, straightens apostrophes, drops punctuation', () => {
    expect(normalizeQuestion('  Am I UGLY?!  ')).toBe('am i ugly');
    expect(normalizeQuestion('I don’t want to be alive.')).toBe("i don't want to be alive");
  });
});

describe('distress list', () => {
  it.each([
    "I don't want to be alive anymore",
    'i want to die',
    'honestly wanna die rn',
    'I keep thinking about suicide',
    "I've been feeling suicidal",
    'I want to kill myself',
    'thinking of ending my life',
    'I want to hurt myself',
    'self-harm',
    "I'd be better off dead",
    'no reason to live',
    'kms',
  ])('catches "%s"', (q) => expect(isDistress(q)).toBe(true));

  it.each([
    'Should I dye my jeans black?',
    'Are deadstock sneakers worth it?',
    'What goes with my olive overshirt?',
    'This jacket is killer, right?',
    'Can I wear boots that are dying at the toe?',
    'I would die for a good pair of loafers lol',
    'How do I cut my jeans into shorts?',
  ])('lets "%s" through', (q) => expect(isDistress(q)).toBe(false));
});

describe('rating him, not the outfit', () => {
  it.each([
    'Rate my face',
    'rate my body out of 10',
    'Am I ugly?',
    'am i fat',
    'Be honest, am I attractive?',
    'Do I look fat',
    'What do you think of my face?',
    'how attractive am i',
    'Is my jawline good',
  ])('refuses "%s"', (q) => expect(isBodyRating(q)).toBe(true));

  it.each([
    'Rate my fit',
    'Rate my outfit',
    'Am I too skinny for oversized stuff?',
    'Do I look fat in this?',
    'Am I dressed OK for an interview?',
    'Does this jacket make my shoulders look wide?',
    'How should chinos fit?',
    'What should I wear for my face shape?',
  ])('sends "%s" on (the model answers the clothes part)', (q) => expect(isBodyRating(q)).toBe(false));
});
