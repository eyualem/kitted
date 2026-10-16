// Round 2 (07 §15): the stylist's voice (K1–K4) and how an answer is laid out (L1–L3), on recorded text only.
import seed from '../../assets/seed.json';
import { answerLayout, chipLabel, chipPieces, pieceSegments, splitLead, type ChipPiece } from '@/features/ask/answerText';
import { checkSentence, createSentenceStream, scoresIn, sentences, stripMarkup, type GateContext } from '@/features/ask/gate';
import { EXAMPLES, PROMPT_VERSION, systemPrompt, type AskKind } from '@/features/ask/prompt';
import { DEMO_CARD_ANSWERS, seededAnswers } from '@/features/ask/source';
import { voiceProblems } from '@/features/ask/voice';
import type { ClosetItemRow } from '@/data/types';

const NO_SCORES: GateContext = { allowedScores: new Set() };
const gated = (chunks: string[], ctx: GateContext = NO_SCORES) => {
  const g = createSentenceStream(ctx);
  let out = '';
  for (const c of chunks) out += g.push(c);
  out += g.end();
  return { text: g.text, out, dropped: g.dropped };
};

describe('K1 · openers and closers', () => {
  const cases: [string, string][] = [
    ['Great question! Wear the dark jeans.', 'Wear the dark jeans.'],
    ['Good question. Wear the dark jeans.', 'Wear the dark jeans.'],
    ['Absolutely! The boots work.', 'The boots work.'],
    ['Absolutely, the boots work.', 'The boots work.'],
    ['Sure! Tuck the tee.', 'Tuck the tee.'],
    ['Sure, tuck the tee.', 'Tuck the tee.'],
    ['Of course, olive and navy get along.', 'Olive and navy get along.'],
    ['Wear the dark jeans. Let me know if you want more ideas!', 'Wear the dark jeans.'],
    ['Wear the dark jeans. Hope this helps!', 'Wear the dark jeans.'],
    ['Wear the dark jeans. Feel free to ask about shoes.', 'Wear the dark jeans.'],
    ['Wear the dark jeans. Any other questions?', 'Wear the dark jeans.'],
    ['Great question! Absolutely, the boots work. Let me know if that helps.', 'The boots work.'],
  ];
  it.each(cases)('%s', (input, want) => {
    expect(gated([input]).text).toBe(want);
  });
  it('keeps a plain yes and a mid-answer "sure"', () => {
    expect(gated(['Yes. Olive and navy get along.']).text).toBe('Yes. Olive and navy get along.');
    expect(gated(['Wear the boots. Make sure the hem sits on them.']).text).toBe('Wear the boots. Make sure the hem sits on them.');
    expect(gated(['Fair, they read dated now anyway.']).text).toBe('Fair, they read dated now anyway.');
  });
  it('logs the drops as filler', () => {
    expect(gated(['Great question! Wear the dark jeans. Hope this helps!']).dropped).toEqual(['filler', 'filler']);
  });
});

describe('K2 · banned words', () => {
  it.each(['This will elevate the outfit.', 'That jacket is pure drip.', 'It has a relaxed vibe.', 'Good vibes all round.', 'Loafers are a game-changer here.', 'That fit goes hard.'])('drops "%s"', (s) => {
    expect(checkSentence(s, NO_SCORES)).toBe('banned');
  });
  it.each(['The hem should drape over the shoe.', 'Dripping wet sneakers need to dry first.', 'An elevator pitch needs a jacket.', 'Keep the hem level all the way round.'])('keeps "%s"', (s) => {
    expect(checkSentence(s, NO_SCORES)).toBeNull();
  });
});

describe('K3 · every demo answer and example reads like the spec', () => {
  const allowed: GateContext = { allowedScores: scoresIn(JSON.stringify(seed)) };
  const answers = [
    ...DEMO_CARD_ANSWERS.map((a) => a.answer),
    ...seededAnswers(seed as unknown as { scenarios: Record<string, unknown> }).map((a) => a.answer),
  ];
  it.each(answers)('%s', (a) => {
    expect(voiceProblems(a)).toEqual([]);
    for (const s of sentences(a)) expect([s, checkSentence(s, allowed)]).toEqual([s, null]);
    expect(gated([a], allowed).text).toBe(a.trim());
  });
  it.each(EXAMPLES.map((e) => [e.q, e.a] as const))('example: %s', (_q, a) => {
    expect(voiceProblems(a)).toEqual([]);
    for (const s of sentences(a)) expect([s, checkSentence(s, { allowedScores: scoresIn(a) })]).toEqual([s, null]);
  });
  it('catches what the spec rules out', () => {
    expect(voiceProblems("It's also the last piece on your Starter 12.")).toContain('internal');
    expect(voiceProblems('Wear P7 with the jeans.')).toContain('internal');
    expect(voiceProblems('Try these:\n- dark jeans\n- white tee')).toContain('list');
    expect(voiceProblems('One. Two. Three. Four.')).toContain('tooManySentences');
    expect(voiceProblems('Is it cold? Is it a date? Wear the boots.')).toContain('question');
    expect(voiceProblems('Wear the overshirt open over the white tee with the dark straight jeans and the white leather sneakers for a clean easy everyday outfit.')).toContain('leadLong');
  });
});

describe('K4 · the prefix is the same for everyone', () => {
  const kinds: AskKind[] = ['explain', 'whatIf', 'goesWith', 'whatToWear', 'canIWear', 'buyNext', 'fitHowTo', 'shape', 'remember', 'feedback', 'general'];
  it('is pure per kind and carries the examples and the voice', () => {
    for (const k of kinds) {
      expect(systemPrompt(k)).toBe(systemPrompt(k));
      expect(systemPrompt(k)).toContain('<examples>');
      expect(systemPrompt(k)).toContain("a friend who's good at clothes");
    }
    expect(PROMPT_VERSION).toBeGreaterThanOrEqual(2);
  });
  it('every example has a closing block that parses', () => {
    for (const e of EXAMPLES) expect(() => JSON.parse(e.block)).not.toThrow();
  });
});

describe('L1 · the lead', () => {
  it.each([
    ['Yes, with the dark jeans. The leg sits on the boots cleanly.', 'Yes, with the dark jeans.', 'The leg sits on the boots cleanly.'],
    ['Tuck the front of the tee in and it goes to 7.5.', 'Tuck the front of the tee in and it goes to 7.5.', ''],
    ['Got it. I\'ll keep that in mind when you ask about pants.', 'Got it. I\'ll keep that in mind when you ask about pants.', ''],
    ['Yes. Olive and navy get along. Wear it open.', 'Yes. Olive and navy get along.', 'Wear it open.'],
    ['Straight vs. wide is your call. Both work here.', 'Straight vs. wide is your call.', 'Both work here.'],
    ['Pick a basic, e.g. a white tee. It goes with everything.', 'Pick a basic, e.g. a white tee.', 'It goes with everything.'],
    ['Hem them for about $15. It\'s worth it.', 'Hem them for about $15.', "It's worth it."],
    ['Go for a 32 inseam at 5′10″. They should just touch the shoe.', 'Go for a 32 inseam at 5′10″.', 'They should just touch the shoe.'],
  ])('%s', (text, lead, rest) => {
    expect(splitLead(text)).toEqual({ lead, rest });
  });
  it('is empty for nothing', () => expect(splitLead('  ')).toEqual({ lead: '', rest: '' }));
});

describe('L2 · piece chips', () => {
  const P = (id: string, name: string): ChipPiece => ({ id, name, hex: '#333333' });
  const pieces = [P('a', 'Dark straight jeans'), P('b', 'Jeans'), P('c', 'White sneakers'), P('d', 'White tee'), P('e', 'Olive overshirt')];
  const chips = (text: string, ps = pieces) => pieceSegments(text, ps).filter((s) => s.piece).map((s) => [s.text, s.piece!.id]);
  it('matches exact names, longest first, whole words', () => {
    expect(chips('Wear the dark straight jeans with the white sneakers.')).toEqual([['dark straight jeans', 'a'], ['white sneakers', 'c']]);
    expect(chips('Your jeans work.')).toEqual([['jeans', 'b']]);
    expect(chips('Bluejeans and white teeth.')).toEqual([]);
    expect(chips("The white tee's hem.")).toEqual([]);
  });
  it('names each piece once and at most 3', () => {
    expect(chips('White tee, white tee, white sneakers, olive overshirt, jeans.')).toEqual([['White tee', 'd'], ['white sneakers', 'c'], ['olive overshirt', 'e']]);
  });
  it('keeps the text whole', () => {
    const text = 'Finish with the white sneakers: it keeps it light.';
    expect(pieceSegments(text, pieces).map((s) => s.text).join('')).toBe(text);
  });
  it('skips a name two pieces share (a guess)', () => {
    expect(chips('The white tee works.', [P('x', 'White tee'), P('y', 'White tee')])).toEqual([]);
  });
  it('only owned pieces that are still there', () => {
    const row = (id: string, name: string, extra: Partial<ClosetItemRow> = {}) => ({ id, name, hex: '#111111', isDeleted: false, source: 'fitCheck', mergedInto: null, maybeSameAs: null, ...extra }) as unknown as ClosetItemRow;
    const ids = chipPieces([row('1', 'Black tee'), row('2', 'Grey tee', { isDeleted: true }), row('3', 'Navy tee', { mergedInto: '1' })]).map((p) => p.id);
    expect(ids).toEqual(['1']);
  });
});

describe('L3 · markup never shows', () => {
  it('strips bold, headings, bullets and code', () => {
    expect(stripMarkup('**Wear the boots.** They `work`.')).toBe('Wear the boots. They work.');
    expect(stripMarkup('# Outfit\n- dark jeans\n2. white tee')).toBe('Outfit\ndark jeans\nwhite tee');
    expect(gated(['**Yes**, with the', ' dark jeans. __The leg__ sits well.']).text).toBe('Yes, with the dark jeans. The leg sits well.');
  });
});

describe('L4 · VoiceOver', () => {
  it('reads the whole answer once and offers each chip as "Open {piece}"', () => {
    const row = (id: string, name: string) => ({ id, name, hex: '#111111', isDeleted: false, source: 'fitCheck', mergedInto: null, maybeSameAs: null }) as unknown as ClosetItemRow;
    const text = 'Wear it open over your white tee and dark jeans. Finish with the white sneakers: olive and denim always get along.';
    const layout = answerLayout(text, [row('1', 'White tee'), row('2', 'Dark jeans'), row('3', 'White sneakers')]);
    expect(layout.lead).toBe('Wear it open over your white tee and dark jeans.');
    expect([layout.lead, layout.rest.map((s) => s.text).join('')].join(' ')).toBe(text);
    expect(layout.chips.map(chipLabel)).toEqual(['Open white sneakers']);
  });
});
