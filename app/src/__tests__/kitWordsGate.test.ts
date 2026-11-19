// T105 · Kit's words: the gate and the cut (specs/kit-stylist-chat.md KC1.1, KC1.4, KC3.3, KC3.5, KC5.2, KC6.2, KC8.1).
// Written before the code (tasks/T105/TESTING.md). Pure: sentences in, a rule name (or null) out. Nothing calls a model.
//   KC1.1 cutAnswer · KC1.4 deny and claim · KC3.3 colorsNamed and the color rule · KC3.5 body words · KC5.2 rewrite ·
//   KC6.2 place · KC8.1 brand, shop, link and price.
import { cutAnswer, checkSentence, colorsNamed, createSentenceStream, DRAWN_CARD_TYPES, pricesIn, rewritePieceNames, wordCount, type GateContext, type GatePiece } from '@/features/ask/gate';
import { t } from '@/i18n/en';

const GATE: GateContext = { allowedScores: new Set<string>() };
const COLORS: GateContext = {
  ...GATE,
  allowedColors: new Set(['off_white_cream', 'light_blue', 'tan_camel']),
  ownColors: new Set(['olive', 'black', 'denim_dark']),
};
const rule = (s: string, ctx: GateContext = GATE) => checkSentence(s, ctx);

// Plain filler words with no clothes, colors, numbers or names in them, so a sentence of any length meets no rule.
const POOL = ['calm', 'steady', 'quiet', 'honest', 'simple', 'clear', 'soft', 'good', 'fine', 'neat', 'easy', 'plain', 'solid', 'kind'];
/** A sentence of exactly `n` words (a capital, then a full stop); `i` shifts the words so no two sentences are alike. */
function sentence(n: number, i = 0): string {
  const words = Array.from({ length: n }, (_, k) => POOL[(i * 3 + k) % POOL.length]!);
  words[0] = words[0]!.charAt(0).toUpperCase() + words[0]!.slice(1);
  return `${words.join(' ')}.`;
}
const text = (...counts: number[]) => counts.map((n, i) => sentence(n, i)).join(' ');

describe('KC1.1 · cutAnswer', () => {
  it('KC1.1 · cutAnswer: with a card, four sentences cut to the first two (18 words)', () => {
    const answer = 'Swap the olive sweater for your cream striped button-up. It brings the tan bomber back into the outfit. The boots stay as they are. Black works with all of it.';
    const cut = cutAnswer(answer, true);
    expect(cut).toBe('Swap the olive sweater for your cream striped button-up. It brings the tan bomber back into the outfit.');
    expect(wordCount(cut)).toBe(18);
    // the same text with no card is inside 60 words and comes back whole
    expect(cutAnswer(answer, false)).toBe(answer);
  });

  it('KC1.1 · cutAnswer: with a card, a second sentence that takes it past 40 words is dropped (10 + 35)', () => {
    const answer = text(10, 35);
    expect(wordCount(answer)).toBe(45);
    expect(cutAnswer(answer, true)).toBe(sentence(10, 0));
    // 10 + 30 is exactly 40 and stays
    expect(cutAnswer(text(10, 30), true)).toBe(text(10, 30));
    // never a third sentence next to a card, even when it would fit the 40 words
    expect(cutAnswer(text(5, 5, 5), true)).toBe(text(5, 5));
  });

  it('KC1.1 · cutAnswer: with no card the limit is 60 words (75 gives four sentences, 61 loses the last)', () => {
    const five = text(15, 15, 15, 15, 15);
    expect(wordCount(five)).toBe(75);
    expect(cutAnswer(five, false)).toBe(text(15, 15, 15, 15));
    expect(wordCount(cutAnswer(five, false))).toBe(60);
    const sixtyOne = text(15, 15, 15, 16);
    expect(wordCount(sixtyOne)).toBe(61);
    expect(cutAnswer(sixtyOne, false)).toBe(text(15, 15, 15));
    // no sentence cap without a card: six short ones inside 60 words stay whole
    expect(cutAnswer(text(5, 5, 5, 5, 5, 5), false)).toBe(text(5, 5, 5, 5, 5, 5));
  });

  it('KC1.1 · cutAnswer: a first sentence of 50 words is kept whole and nothing follows it (with a card)', () => {
    const answer = text(50, 4);
    expect(cutAnswer(answer, true)).toBe(sentence(50, 0));
    // never cut inside it, however long
    expect(cutAnswer(text(90, 3), false)).toBe(sentence(90, 0));
  });

  it('KC1.1 · cutAnswer: text inside the limit comes back unchanged (trimmed)', () => {
    expect(cutAnswer(sentence(12), true)).toBe(sentence(12));
    expect(cutAnswer('Swap it.\nThe olive blurs.', true)).toBe('Swap it.\nThe olive blurs.');
    expect(cutAnswer('Swap it.\nThe olive blurs.', false)).toBe('Swap it.\nThe olive blurs.');
    expect(cutAnswer(`  ${sentence(12)}  \n`, false)).toBe(sentence(12));
  });

  it('KC1.1 · cutAnswer: "7.5" and "e.g." never split a sentence, and wordCount reads the way the spec says', () => {
    const answer = 'The 7.5 sneaker works, e.g. with chinos. It anchors the look. A third one follows here.';
    expect(cutAnswer(answer, true)).toBe('The 7.5 sneaker works, e.g. with chinos. It anchors the look.');
    expect(wordCount('button-up 7.5 —')).toBe(2);
    expect(wordCount('')).toBe(0);
    expect(wordCount('  one   two\nthree ')).toBe(3);
    expect(wordCount('Swap the olive sweater for your cream striped button-up.')).toBe(9);
  });

  it('KC1.1 · cutAnswer: always a prefix of the trimmed input, never longer, never mid-sentence', () => {
    const inputs = [text(9, 9, 6, 6), text(10, 35), text(15, 15, 15, 15, 15), text(50, 4), 'Swap it.\nThe olive blurs.\nThen go.', text(20, 20, 20), text(3, 3, 3, 3, 3, 3, 3)];
    for (const input of inputs) {
      for (const withCard of [true, false]) {
        const cut = cutAnswer(input, withCard);
        expect(input.trim().startsWith(cut)).toBe(true);
        expect(cut.length).toBeLessThanOrEqual(input.trim().length);
        expect(cut.length).toBeGreaterThan(0);
        // ends where a sentence ends (full stop) unless it is the whole text
        expect(/[.!?]$/.test(cut)).toBe(true);
      }
    }
  });

  it('KC1.1 · the cards that count as "a card" are exactly the six drawn ones', () => {
    expect([...DRAWN_CARD_TYPES].sort()).toEqual(['add', 'buy', 'changed', 'colors', 'options', 'outfit']);
  });
});

describe('KC1.4 · deny and claim', () => {
  it('KC1.4 · deny: "I can\'t add / change / show" is dropped under every flag, and the honest "can\'t" lines stay', () => {
    const denied = [
      "I can't add an unphotographed piece to your closet.",
      "I'm not able to add that to your closet.",
      "Sorry, I can't change that piece's color.",
      "I can't show you an outfit for that.",
      "I'm unable to update that piece.",
    ];
    for (const s of denied) {
      expect([s, rule(s)]).toEqual([s, 'deny']);
      // `deny` has no flag: kept under none of them
      expect([s, rule(s, { ...GATE, didAdd: true })]).toEqual([s, 'deny']);
      expect([s, rule(s, { ...GATE, didChange: true })]).toEqual([s, 'deny']);
      expect([s, rule(s, { ...GATE, didAdd: true, didChange: true, outfitsOn: true })]).toEqual([s, 'deny']);
    }
    // must pass, all flags off
    const fine = [
      "I can't see the fit in a message, so send a photo and I'll score it.",
      "I can't give you a score here; only a fit check does.",
      "I can't say without seeing the hem.",
      "I'd add a belt to finish it.",
      "I'll remember that you skip skinny jeans.",
    ];
    for (const s of fine) {
      expect([s, rule(s)]).toEqual([s, null]);
      expect([s, rule(s, { ...GATE, didAdd: false, didChange: false })]).toEqual([s, null]);
    }
  });

  it.each([
    "I've added the cream button-up to your closet.",
    "It's now added to your closet.",
  ])('KC1.4 · claim (add): %s is dropped unless the code added a piece', (s) => {
    expect(rule(s)).toBe('claim');
    expect(rule(s, { ...GATE, didAdd: false })).toBe('claim');
    expect(rule(s, { ...GATE, didChange: true })).toBe('claim'); // a change is not an add
    expect(rule(s, { ...GATE, didAdd: true })).toBeNull();
  });

  it.each([
    'I changed your boots to black.',
    'I just renamed the piece.',
  ])('KC1.4 · claim (change): %s is dropped unless the code changed a piece', (s) => {
    expect(rule(s)).toBe('claim');
    expect(rule(s, { ...GATE, didChange: false })).toBe('claim');
    expect(rule(s, { ...GATE, didAdd: true })).toBe('claim'); // an add is not a change
    expect(rule(s, { ...GATE, didChange: true })).toBeNull();
  });
});

describe('KC3.3 · colorsNamed and the color rule', () => {
  it.each([
    ['off-white', ['off_white_cream']],
    ['Off white shirt', ['off_white_cream']],
    ['A cream button-up', ['off_white_cream']],
    ['light blue', ['light_blue']],
    ['navy blue', ['navy']],
    ['dark blue', ['navy']],
    ['dark grey', ['charcoal']],
    ['dark gray', ['charcoal']],
    ['beige', ['khaki_beige']],
    ['khaki', ['khaki_beige']],
    ['camel', ['tan_camel']],
    ['a tan belt', ['tan_camel']],
    ['light grey', ['light_grey']],
    ['Pair the black jeans with a gold watch and a denim jacket', ['black']],
    ['Olive and white work together', ['white', 'olive']], // palette order, not the order said
    ['white, white and more white', ['white']], // no duplicates
    ['A multicolor print with silver trim', []],
    ['Stand tall and wear it with confidence', []], // "tan" inside "stand" is not a color
    ['The greenhouse sells nothing', []],
  ])('KC3.3 · colorsNamed(%j) is %j', (s, families) => {
    expect(colorsNamed(s)).toEqual(families);
  });

  it('KC3.3 · colorsNamed: "light blue" is never also "blue", "navy blue" never also "blue", "dark grey" never also "grey"', () => {
    expect(colorsNamed('Try light blue.')).not.toContain('blue');
    expect(colorsNamed('Try navy blue.')).not.toContain('blue');
    expect(colorsNamed('Try dark grey.')).not.toContain('grey');
    expect(colorsNamed('Try blue.')).toEqual(['blue']);
    expect(colorsNamed('Try grey.')).toEqual(['grey']);
  });

  it('KC3.3 · color rule: a color outside the list and outside his own pieces drops the sentence', () => {
    expect(rule('Red would pop here.', COLORS)).toBe('color');
    expect(rule('Try a burgundy one.', COLORS)).toBe('color');
    expect(rule('Beige is fine.', COLORS)).toBe('color'); // beige is not tan
    expect(rule('Off-white works, but red does not.', COLORS)).toBe('color'); // one bad color is enough
    expect(rule('Off-white or light blue works.', COLORS)).toBeNull();
    expect(rule('Your olive sweater stays.', COLORS)).toBeNull(); // his own piece's color
    expect(rule('Wear the dark denim jeans.', COLORS)).toBeNull();
    expect(rule('A tan belt finishes it.', COLORS)).toBeNull();
    expect(rule('The fit matters more than the shade.', COLORS)).toBeNull(); // no color word
    expect(rule('Add a gold watch and a denim jacket.', COLORS)).toBeNull(); // metals and a fabric never count
    expect(rule('A multicolor print is too much.', COLORS)).toBeNull();
    // with no list (null, absent or empty) the sentence rule is off
    expect(rule('Red would pop here.', { ...GATE, allowedColors: null })).toBeNull();
    expect(rule('Red would pop here.', GATE)).toBeNull();
    expect(rule('Red would pop here.', { ...GATE, allowedColors: new Set<string>(), ownColors: new Set(['olive']) })).toBeNull();
  });
});

describe('KC3.5 · body words about color', () => {
  it('KC3.5 · body words: skin, eyes, undertones, complexion and hair color are dropped; clothes talk about color stays', () => {
    const dropped = [
      'Olive suits your skin tone.',
      'Navy brings out your eyes.',
      'Cool undertones work best with silver.',
      'Warm colors flatter a fair complexion.',
      'Earth tones go with brown eyes.',
      'Match it to your hair color.',
      'Pick what suits your coloring.',
    ];
    for (const s of dropped) expect([s, rule(s)]).toEqual([s, 'body']);
    const kept = [
      'A bold eye-catching color works as the one accent.',
      'Navy with olive works because the browns stay warm.',
      'I rate outfits, never people.',
    ];
    for (const s of kept) expect([s, rule(s)]).toEqual([s, null]);
  });
});

describe('KC5.2 · rewrite', () => {
  const BOOTS: GatePiece = { name: 'Black work boots', category: 'footwear', subcategory: 'work_boot', color: 'black', leg: 'na' };
  const JEANS: GatePiece = { name: 'Dark jeans', category: 'bottom', subcategory: 'jeans', color: 'denim_dark', leg: 'straight' };
  const MINE = [BOOTS, JEANS];

  it.each([
    ['Wear your dark brown work boots with the jeans.', 'Wear your black work boots with the jeans.'],
    ['Your brown boots look right here.', 'Your black work boots look right here.'],
    ['The brown boots disappear under wide jeans.', 'The black work boots disappear under wide jeans.'],
  ])('KC5.2 · rewrite: %s becomes %s', (before, after) => {
    expect(rewritePieceNames(before, MINE)).toBe(after);
  });

  it.each([
    'Wear your black work boots.',
    'Wear the boots.',
    'Buy the olive chinos instead.', // a kind he doesn't own
    'Pick up a pair of olive chinos.',
    'Your brown loafers look right here.', // never renamed to a piece of a different kind
    'Your brown sneakers look right here.', // same slot, different kind
  ])('KC5.2 · unchanged: %s', (s) => {
    expect(rewritePieceNames(s, MINE)).toBe(s);
  });

  it('KC5.2 · with two boots the mention is not rewritten', () => {
    const chelsea: GatePiece = { name: 'Brown chelsea boots', category: 'footwear', subcategory: 'chelsea_boot', color: 'brown', leg: 'na' };
    expect(rewritePieceNames('Wear your tan boots.', [BOOTS, chelsea, JEANS])).toBe('Wear your tan boots.');
    expect(rewritePieceNames('Your red boots look right here.', [BOOTS, chelsea, JEANS])).toBe('Your red boots look right here.');
  });

  it('KC5.2 · a leg clash is not rewritten (his jeans are straight)', () => {
    expect(rewritePieceNames('Wear your wide jeans.', MINE)).toBe('Wear your wide jeans.');
  });

  it('KC5.2 · through the stream a wrong color is shown rewritten, and what cannot be rewritten still goes by its rule', () => {
    const navy: GatePiece = { name: 'Navy chelsea boots', category: 'footwear', subcategory: 'chelsea_boot', color: 'navy', leg: 'na' };
    const ctx: GateContext = { allowedScores: new Set<string>(), pieceNames: ['Black work boots', 'Dark jeans'], pieces: MINE };
    const run = (c: GateContext, ...parts: string[]) => {
      const st = createSentenceStream(c);
      for (const p of parts) st.push(p);
      st.end();
      return st;
    };
    // rewritten, not dropped, no `fact`
    const a = run(ctx, 'Wear your dark brown work boots with the jeans. ', 'Your brown boots look right here. ', 'The brown boots disappear under wide jeans.');
    expect(a.text).toBe('Wear your black work boots with the jeans. Your black work boots look right here. The black work boots disappear under wide jeans.');
    expect(a.dropped).toEqual([]);
    // a correct mention is untouched, and the first word keeps its capital
    const b = run(ctx, 'Your black work boots stay. Wear the boots.');
    expect(b.text).toBe('Your black work boots stay. Wear the boots.');
    expect(b.dropped).toEqual([]);
    // a leg clash and a two-boots clash are dropped as fact, as before
    const c = run({ allowedScores: new Set<string>(), pieces: MINE }, 'Wear your wide jeans.');
    expect([c.text, c.dropped]).toEqual(['', ['fact']]);
    const d = run({ allowedScores: new Set<string>(), pieces: [BOOTS, navy, JEANS] }, 'Wear your tan boots.');
    expect([d.text, d.dropped]).toEqual(['', ['fact']]);
    // the rewrite runs first, then every rule: a rewritten sentence another rule would drop is dropped by that rule
    const e = run({ ...ctx, pieceNames: ['Black work boots'] }, 'Your brown boots look great, and Nike makes them.');
    expect([e.text, e.dropped]).toEqual(['', ['brand']]);
    const f = run({ ...ctx, pieceNames: ['Black work boots'] }, 'Your brown boots score 9.5.');
    expect([f.text, f.dropped]).toEqual(['', ['score']]);
  });
});

describe('KC6.2 · place', () => {
  it.each([
    'Tap the buy-next section in Closet.',
    'Open the Next buy tab.',
    "It's on the best buy screen.",
  ])('KC6.2 · dropped as place: %s', (s) => {
    expect(rule(s)).toBe('place');
    expect(rule(s, { ...GATE, outfitsOn: true })).toBe('place'); // these places never exist
  });

  it('KC6.2 · the Outfits tab is dropped while Outfits is off and kept when it is on; the buy card\'s own name is no place', () => {
    expect(rule('Check the Outfits tab.')).toBe('place');
    expect(rule('Check the Outfits tab.', { ...GATE, outfitsOn: false })).toBe('place');
    expect(rule('Check the Outfits tab.', { ...GATE, outfitsOn: true })).toBeNull();
    for (const s of [
      "Here's your next buy.",
      "Ask me what to buy next, and I'll show it here.",
      'Open Past chats from Stylist.',
      'Your Next buy card shows the olive overshirt.',
    ]) {
      expect([s, rule(s)]).toEqual([s, null]);
      expect([s, rule(s, { ...GATE, outfitsOn: true })]).toEqual([s, null]);
    }
  });
});

describe('KC8.1 · brand, shop, link', () => {
  it('KC8.1 · brand: shops, brands and links are dropped; "shops" alone, "guess" and "gap" are not', () => {
    const dropped = [
      'Uniqlo has a good one.',
      'Try Nike or Adidas.',
      'You can get it on Amazon.',
      'Check Etsy, Depop or Grailed.',
      'Try Target for a plain one.',
      'Look at www.example.com for one.',
      'Search nordstrom.com.',
      'https://shop.example.com/overshirt',
      'Todd Snyder makes a good one.',
      'A Casio works with it.',
    ];
    for (const s of dropped) expect([s, rule(s)]).toEqual([s, 'brand']);
    const kept = [
      "I don't point to shops, but here's what to look for: a cotton or canvas overshirt, straight hem, room for a sweater under it.",
      "I don't point to shops, but here's what to look for:",
      'I guess a cotton one works.',
      'Mind the gap above the shoe.',
      'Thrift stores are good for this.',
    ];
    for (const s of kept) expect([s, rule(s)]).toEqual([s, null]);
  });
});

describe('KC8.1 · price', () => {
  it.each([
    'A cotton overshirt runs about $90.',
    "It's a $120 jacket.",
    'Boots start at 80 dollars.',
    'Loafers cost $30–60 at most places.',
  ])('KC8.1 · dropped as price: %s', (s) => {
    expect(rule(s)).toBe('price');
  });

  it('KC8.1 · a service price passes, and an amount in the pack or evidence passes', () => {
    expect(rule('Hemming costs about $15 at a tailor.')).toBeNull();
    const budget: GateContext = { ...GATE, allowedPrices: new Set(['115']) };
    expect(rule('A jacket around $115 fits your budget.', budget)).toBeNull();
    expect(rule('A jacket around $90 fits your budget.', budget)).toBe('price');
    // without the amount in the list it is dropped
    expect(rule('A jacket around $115 fits your budget.')).toBe('price');
  });

  it('KC8.1 · pricesIn reads dollar amounts, ranges, dollars and bucks', () => {
    expect(pricesIn('$115 and $30–60 and 90 bucks')).toEqual(new Set(['115', '30', '60', '90']));
    expect(pricesIn('Boots start at 80 dollars.')).toEqual(new Set(['80']));
    expect(pricesIn('No money talk here, just 7.5 and a size 32.')).toEqual(new Set());
  });
});
