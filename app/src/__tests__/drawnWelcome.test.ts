// T38 · Welcome and the Example check, drawn in code (specs/onboarding-screens.md OS1–OS2; tasks/T38/TESTING.md).
// The pure half: the example's numbers against the engine's own answer, the drawing's pieces, the swap's timeline,
// the words, the VoiceOver lines and Welcome's layout rule.
//
// Profile (CLAUDE.md rule 6): s14 is a stock photo's bundled reading, "profile unknown", run with one stated test
// profile: occasion everyday, no picked looks, boldness null, an empty closet, a first check. No photo is used here.
import { applyPartsFix, FAMILY_HEX, type Fix, type Reading } from '@kitted/core';
import { displayScore, scoreWordLabel, spokenScore } from '@/design-system/score';
import { artSpec } from '@/features/closet/artSpec';
import { baseName } from '@/features/closet/itemName';
import { evaluateCheck, overallFor, scoreOptions } from '@/features/fitcheck/scoring';
import { exampleCheck } from '@/features/onboarding/exampleCheck';
import { drawnOutfitA11y, drawnPieces, tilePlacement, welcomePlacement, WELCOME_BOX, type DrawnSlot } from '@/features/onboarding/outfitDrawing';
import {
  SWAP_MS, WELCOME_READING, welcomeAfterFrame, welcomeCardA11y, welcomeExample, welcomeLayout, welcomeMotion, welcomeSwapFrame,
  type WelcomeLayoutInput,
} from '@/features/onboarding/welcomeExample';
import { demoReadingById } from '@/services/readingSource/demoReadings';
import { en, t } from '@/i18n/en';
import s14File from '../../assets/demo-readings/s14.json';

// ── The engine's own answer, computed here, independently of the code under test ──────────────────────────────────
const reading = demoReadingById('s14')!;
const ev = evaluateCheck({ reading, occasion: 'everyday', styles: [], boldness: null, closet: [], firstCheck: true });
const top = ev.row.fixes[0] as Fix;
const afterReading = applyPartsFix(reading, top)!;
const opts = scoreOptions({ occasion: 'everyday', styles: [], boldness: null });
const SLOTS: DrawnSlot[] = ['outer', 'top', 'bottom', 'shoes'];
const strings = en as unknown as Record<string, string>;
const readingOf = (x: unknown) => (x as { reading?: Reading }).reading;
const r1 = (x: number) => Math.round(x * 10) / 10;
const r4 = (x: number) => Math.round(x * 1e4) / 1e4;
const pieceIn = (r: Reading, slot: DrawnSlot) => drawnPieces(r).find((p) => p.slot === slot);

describe('OS1.1 · no photo', () => {
  it('OS1.1 · the example data carries a reading, no photo', () => {
    const w = welcomeExample();
    const ex = exampleCheck();
    expect(w).not.toBeNull();
    expect(ex).not.toBeNull();
    expect(WELCOME_READING).toBe('s14');
    expect(Object.prototype.hasOwnProperty.call(ex, 'photoId')).toBe(false);
    expect(readingOf(ex)).toBe(w!.reading);
    expect(w!.reading).toBe(demoReadingById('s14'));
    for (const k of Object.keys(w!)) expect(k).not.toMatch(/photo|image|uri|source/i);
    for (const k of Object.keys(ex!)) expect(k).not.toMatch(/photo|image|uri|source/i);
    // Nothing photographic anywhere inside either (no file, no uri, no photo id).
    expect(JSON.stringify(w)).not.toMatch(/photo|\.jpe?g|\.png|\.heic|file:|https?:/i);
    expect(JSON.stringify(ex)).not.toMatch(/photo|\.jpe?g|\.png|\.heic|file:|https?:/i);
  });

  it('OS1.1 · the drawing is garments only', () => {
    const pieces = drawnPieces(reading);
    expect(pieces.map((p) => p.slot)).toEqual(['outer', 'top', 'bottom', 'shoes']);
    for (const p of pieces) expect(['top', 'bottom', 'shoe']).toContain(p.spec.shape);
    // Each piece is the reading's own garment, drawn by Closet's code with its family's swatch and no closet art.
    const byCat: Record<DrawnSlot, string> = { outer: 'outerwear', top: 'top', bottom: 'bottom', shoes: 'footwear' };
    for (const p of pieces) {
      const g = reading.garments.find((x) => x.category === byCat[p.slot])!;
      expect(p.garment).toBe(g);
      expect(p.spec).toEqual(artSpec({ garment: g, hex: FAMILY_HEX[String(g.color_family)]!, art: null, name: '' } as never));
      expect(p.name).toBe(baseName(g, null));
    }
    expect(pieces.map((p) => p.name)).toEqual(['Charcoal denim jacket', 'White sweater', 'Grey drawstring trousers', 'Grey chunky sneakers']);
  });

  it('OS1.1 · a garment outside the four slots is left out, and the first garment of a slot wins', () => {
    const extraTop = { ...reading.garments.find((g) => g.category === 'top')!, subcategory: 'tee', color_family: 'black' };
    const hat = { ...reading.garments[0]!, category: 'accessory', subcategory: 'cap' };
    const r = { ...reading, garments: [...reading.garments, extraTop, hat] } as Reading;
    const pieces = drawnPieces(r);
    expect(pieces.map((p) => p.slot)).toEqual(['outer', 'top', 'bottom', 'shoes']);
    expect(pieces.find((p) => p.slot === 'top')!.garment).toBe(reading.garments.find((g) => g.category === 'top'));
    const noShoes = { ...reading, garments: reading.garments.filter((g) => g.category !== 'footwear') } as Reading;
    expect(drawnPieces(noShoes).map((p) => p.slot)).toEqual(['outer', 'top', 'bottom']);
  });
});

describe('OS1.2 · the numbers are the engine\'s', () => {
  it("OS1.2 · before, after, both words and the fix are the engine's", () => {
    const w = welcomeExample()!;
    expect(ev.row.status).toBe('scored');
    expect(w.score).toBe(overallFor(reading, opts));
    expect(w.score).toBe(ev.row.score);
    expect(w.word).toBe(scoreWordLabel(w.score));
    expect(w.fix).toMatchObject({ copy: top.copy, tag: top.tag, to: top.to });
    expect(w.after).toEqual({ score: overallFor(afterReading, opts), word: scoreWordLabel(overallFor(afterReading, opts)!) });
    expect(w.after.score).toBe(top.to);
    expect(w.afterReading).toEqual(afterReading);
    expect(w.reading).toBe(demoReadingById('s14'));
    expect(w.reading.garments).toEqual((s14File as unknown as Reading).garments);
  });

  it('OS1.2 · the after state is the top fix applied to the same reading, and it swaps the shoes only', () => {
    const w = welcomeExample()!;
    const before = drawnPieces(reading);
    const after = drawnPieces(afterReading);
    expect(after.map((p) => p.slot)).toEqual(before.map((p) => p.slot));
    const differ = SLOTS.filter((s) => JSON.stringify(pieceIn(reading, s)!.garment) !== JSON.stringify(pieceIn(afterReading, s)!.garment));
    expect(differ).toEqual(['shoes']);
    expect(w.swapSlot).toBe('shoes');
    const shoesAfter = pieceIn(afterReading, 'shoes')!;
    const shoesBefore = pieceIn(reading, 'shoes')!;
    expect(shoesAfter.garment.subcategory).toBe('low_profile_sneaker');
    expect(shoesAfter.garment.color_family).toBe('white');
    expect(shoesAfter.garment.condition).toBe('clean');
    expect((shoesBefore.spec.flat as { chunky?: boolean }).chunky).toBe(true);
    expect(shoesBefore.spec.glyphs).toContain('chunkySole');
    expect((shoesAfter.spec.flat as { chunky?: boolean }).chunky).toBe(false);
    expect(shoesAfter.spec.glyphs).not.toContain('chunkySole');
    // The other three pieces draw exactly the same before and after.
    for (const s of ['outer', 'top', 'bottom'] as const) expect(pieceIn(afterReading, s)!.spec).toEqual(pieceIn(reading, s)!.spec);
  });

  // Pinned (DESIGN.md "What the scoring code gives it"). If this test alone fails after a scoring change, the build
  // stops and the founder sees the new Welcome (IMPLEMENTATION technical default 13): never edit the engine or fixtures.
  it("OS1.2 · today's engine gives 7.5 Put together → 8.0 Sharp with the sneaker swap (the approved design)", () => {
    const w = welcomeExample()!;
    expect(w.score).toBe(7.5);
    expect(w.word).toBe('Put together');
    expect(displayScore(w.score)).toBe('7.5');
    expect(w.after).toEqual({ score: 8, word: 'Sharp' });
    expect(displayScore(w.after.score)).toBe('8.0');
    expect(w.fix).toMatchObject({ copy: 'Swap the chunky sneakers for low-profile sneakers', tag: 'Raises Shoes to 8 · free if you own one', to: 8 });
  });

  it('OS1.2 · same reading, same score', () => {
    const w = welcomeExample()!;
    expect(welcomeExample()).toBe(w);
    expect(exampleCheck()!.score).toBe(w.score);
    // The same garments, scored again from a fresh copy, give the same numbers; and nothing mutated the reading.
    const copy = JSON.parse(JSON.stringify(s14File)) as Reading;
    expect(overallFor({ scene: copy.scene, garments: copy.garments } as Reading, opts)).toBe(w.score);
    expect(overallFor(applyPartsFix(reading, top)!, opts)).toBe(w.after.score);
    expect(reading.garments).toEqual((s14File as unknown as Reading).garments);
  });

  it('OS1.2 · no fix (or a fix whose edits can\'t be applied) → no example', () => {
    const real = exampleCheck()!;
    const variants: unknown[] = [
      { ...real, fixes: [] },
      { ...real, fixes: [{ ...real.fixes[0]!, edits: [{ op: 'set', slot: 'not_a_slot', fields: { color_family: 'white' } }], itemId: null }] },
      null,
    ];
    for (const v of variants) {
      jest.isolateModules(() => {
        jest.doMock('@/features/onboarding/exampleCheck', () => ({ exampleCheck: () => v }));
        const mod = jest.requireActual<typeof import('@/features/onboarding/welcomeExample')>('@/features/onboarding/welcomeExample');
        expect(mod.welcomeExample()).toBeNull();
      });
      jest.dontMock('@/features/onboarding/exampleCheck');
    }
  });
});

describe('OS1.3 · the swap plays once, then holds still', () => {
  const ex = { score: 7.5, after: { score: 8, word: 'Sharp' } };

  it('OS1.3 · the timeline, frame by frame', () => {
    expect(SWAP_MS).toEqual({ shoesFrom: 600, shoesTo: 1200, countFrom: 900, landBy: 1500, textFrom: 1500, textTo: 1700, doneAt: 2000 });
    const f = (tMs: number) => welcomeSwapFrame(tMs, ex);
    expect(f(0)).toEqual({ numeral: '7.5', pieceAfter: 0, textAfter: 0, done: false });
    expect(f(600)).toEqual({ numeral: '7.5', pieceAfter: 0, textAfter: 0, done: false });
    expect(f(900).numeral).toBe('7.5');
    expect(Math.abs(f(900).pieceAfter - 0.5)).toBeLessThanOrEqual(0.01);
    expect(f(999).numeral).toBe('7.5');
    expect(f(1000).numeral).toBe('7.6');
    expect(f(1100).numeral).toBe('7.7');
    expect(f(1100).pieceAfter).toBeGreaterThan(0.5);
    expect(f(1100).pieceAfter).toBeLessThan(1);
    expect(f(1200).numeral).toBe('7.8');
    expect(f(1200).pieceAfter).toBe(1);
    expect(f(1300).numeral).toBe('7.9');
    expect(f(1400).numeral).toBe('8.0');
    expect(f(1499).numeral).toBe('8.0');
    expect(f(1499).textAfter).toBe(0);
    expect(Math.abs(f(1600).textAfter - 0.5)).toBeLessThanOrEqual(0.01);
    expect(f(1700).textAfter).toBe(1);
    expect(f(1999).done).toBe(false);
    expect(f(2000)).toEqual({ numeral: '8.0', pieceAfter: 1, textAfter: 1, done: true });
    expect(f(60000)).toEqual({ numeral: '8.0', pieceAfter: 1, textAfter: 1, done: true });
    // Never backwards, and the count goes through every tenth (no "7.5" → "8.0" jump).
    const seen: string[] = [];
    let prev = f(0);
    for (let tMs = 0; tMs <= 2100; tMs += 10) {
      const cur = f(tMs);
      expect(cur.pieceAfter).toBeGreaterThanOrEqual(prev.pieceAfter);
      expect(cur.textAfter).toBeGreaterThanOrEqual(prev.textAfter);
      expect(cur.pieceAfter).toBeGreaterThanOrEqual(0);
      expect(cur.textAfter).toBeLessThanOrEqual(1);
      if (seen[seen.length - 1] !== cur.numeral) seen.push(cur.numeral);
      prev = cur;
    }
    expect(seen).toEqual(['7.5', '7.6', '7.7', '7.8', '7.9', '8.0']);
    expect(welcomeAfterFrame(ex)).toEqual(f(2000));
    expect(welcomeAfterFrame(ex)).toEqual({ numeral: '8.0', pieceAfter: 1, textAfter: 1, done: true });
  });

  it('OS1.3 · a wider gap still counts in tenths and lands by 1500 ms; no gain holds the before score', () => {
    const wide = { score: 6, after: { score: 7.5, word: 'Put together' } };
    const seen: string[] = [];
    for (let tMs = 0; tMs <= 2000; tMs += 1) {
      const n = welcomeSwapFrame(tMs, wide).numeral;
      if (seen[seen.length - 1] !== n) seen.push(n);
    }
    expect(seen).toEqual(['6.0', '6.1', '6.2', '6.3', '6.4', '6.5', '6.6', '6.7', '6.8', '6.9', '7.0', '7.1', '7.2', '7.3', '7.4', '7.5']);
    expect(welcomeSwapFrame(1500, wide).numeral).toBe('7.5');
    expect(welcomeSwapFrame(999, wide).numeral).not.toBe('7.5');
    const down = { score: 8, after: { score: 7.5, word: 'Put together' } };
    expect(welcomeSwapFrame(1499, down).numeral).toBe('8.0');
    expect(welcomeSwapFrame(1500, down).numeral).toBe('7.5');
    expect(welcomeSwapFrame(2000, down)).toEqual({ numeral: '7.5', pieceAfter: 1, textAfter: 1, done: true });
  });

  it('OS1.3 · Reduce Motion and accessibility sizes are still', () => {
    expect(welcomeMotion({ reduceMotion: false, accessibilitySize: false })).toBe('play');
    expect(welcomeMotion({ reduceMotion: true, accessibilitySize: false })).toBe('still');
    expect(welcomeMotion({ reduceMotion: false, accessibilitySize: true })).toBe('still');
    expect(welcomeMotion({ reduceMotion: true, accessibilitySize: true })).toBe('still');
  });
});

describe('OS1.4 · words, VoiceOver, layout', () => {
  it("OS1.4 · Welcome's words are unchanged", () => {
    expect(t('onb.welcome.title')).toBe('Look put together.\nWithout trying\ntoo hard.');
    expect(t('onb.welcome.body')).toBe('Send a fit. Get a score out of 10 and the two or three moves that raise it.');
    expect(t('onb.welcome.start')).toBe('Get started');
    expect(t('onb.welcome.example')).toBe('See an example check');
    expect(t('onb.welcome.haveAccount')).toBe('I already have an account');
    expect(t('onb.welcome.cardTag')).toBe('Fit check');
    expect(t('onb.welcome.cardOccasion')).toBe('Everyday');
    expect(t('onb.welcome.cardDetail')).toBe('Full check');
    expect(strings['onb.welcome.cardA11y']).toBe(
      'Example fit check. {occasion}. {before} out of 10, {beforeWord}. One fix: {fix}. {after} out of 10, {afterWord}.',
    );
  });

  it("OS1.4 · the card's VoiceOver line", () => {
    const w = welcomeExample()!;
    expect(welcomeCardA11y(w)).toBe(
      'Example fit check. Everyday. 7.5 out of 10, Put together. One fix: Swap the chunky sneakers for low-profile sneakers. 8 out of 10, Sharp.',
    );
    // Built from the example it's given (not typed in), scores spoken ("6", never "6.0").
    const other = { ...w, score: 6, word: 'Getting there', after: { score: 6.5, word: 'Getting there' }, fix: { copy: 'Tuck the tee', tag: 'x', to: 6.5 } };
    expect(welcomeCardA11y(other)).toBe('Example fit check. Everyday. 6 out of 10, Getting there. One fix: Tuck the tee. 6.5 out of 10, Getting there.');
    expect(spokenScore(8)).toBe('8');
  });

  it('OS1.4 · the layout fits every phone', () => {
    const L = (o: Partial<WelcomeLayoutInput> & Pick<WelcomeLayoutInput, 'width' | 'height' | 'safeTop' | 'bottomBlockHeight' | 'cardAfterHeight'>) =>
      welcomeLayout({ accessibilitySize: false, ...o });

    const a = L({ width: 402, height: 874, safeTop: 62, bottomBlockHeight: 387, cardAfterHeight: 136 });
    expect(r4(a.k)).toBe(0.8788);
    expect([r1(a.drawing.width), r1(a.drawing.height), r1(a.drawing.left), r1(a.drawing.top)]).toEqual([188.1, 284.7, 12, 132.1]);
    expect([r1(a.card.top), a.card.right, a.card.width]).toEqual([206.5, 20, 188]);
    expect(r1(a.bottomBlockTop)).toBe(487);
    expect(a.scrolls).toBe(false);

    const b = L({ width: 375, height: 667, safeTop: 20, bottomBlockHeight: 359, cardAfterHeight: 136 });
    expect(r4(b.k)).toBe(0.7407);
    expect([r1(b.drawing.width), r1(b.drawing.height), r1(b.drawing.top)]).toEqual([158.5, 240, 44]);
    expect(r1(b.card.top)).toBe(96);
    expect(r1(b.bottomBlockTop)).toBe(308);
    expect(b.scrolls).toBe(false);

    const c = L({ width: 390, height: 844, safeTop: 47, bottomBlockHeight: 426, cardAfterHeight: 136 });
    expect(r4(c.k)).toBe(0.8182);
    expect(r1(c.drawing.top)).toBe(100);
    expect(r1(c.card.top)).toBe(164.5);
    expect(r1(c.bottomBlockTop)).toBe(418);
    expect(c.scrolls).toBe(false);

    const d = L({ width: 440, height: 956, safeTop: 62, bottomBlockHeight: 400, cardAfterHeight: 136 });
    expect(r4(d.k)).toBe(1);
    expect([r1(d.drawing.width), r1(d.drawing.height), r1(d.drawing.top)]).toEqual([214, 324, 147]);
    expect(r1(d.card.top)).toBe(241);
    expect(r1(d.bottomBlockTop)).toBe(556);
    expect(d.scrolls).toBe(false);

    const e = L({ width: 375, height: 667, safeTop: 20, bottomBlockHeight: 450, cardAfterHeight: 136 });
    expect(r4(e.k)).toBe(0.6);
    expect(r1(e.drawing.top)).toBe(44);
    expect(r1(e.card.top)).toBe(73.2);
    expect(r1(e.bottomBlockTop)).toBe(262.4);
    expect(e.scrolls).toBe(true);

    const f = L({ width: 375, height: 667, safeTop: 20, bottomBlockHeight: 359, cardAfterHeight: 260 });
    expect(r4(f.k)).toBe(0.7407);
    expect(r1(f.card.top)).toBe(44);
    expect(r1(f.drawing.top)).toBe(54);
    expect(r1(f.bottomBlockTop)).toBe(328);
    expect(f.scrolls).toBe(true);

    // Every width 375–440: the drawing is never under the card, and both end 24 pt above the bottom block.
    for (let width = 375; width <= 440; width += 1) {
      const g = L({ width, height: 874, safeTop: 62, bottomBlockHeight: 387, cardAfterHeight: 136 });
      expect(g.drawing.left).toBe(12);
      expect(g.card.right).toBe(20);
      expect(g.card.width).toBe(188);
      expect(r4(g.drawing.width)).toBe(r4(214 * g.k));
      expect(r4(g.drawing.height)).toBe(r4(324 * g.k));
      expect(12 + 198 * g.k).toBeLessThanOrEqual(width - 208 - 8 + 1e-9);
      expect(g.drawing.top + g.drawing.height).toBeLessThanOrEqual(g.bottomBlockTop - 24 + 1e-9);
      expect(g.card.top + 136).toBeLessThanOrEqual(g.bottomBlockTop - 24 + 1e-9);
      expect(g.scrolls).toBe(false);
    }

    // Accessibility sizes: the drawing at 0.69, centred; the card at full width under it; then the bottom block.
    const ax = welcomeLayout({ width: 402, height: 874, safeTop: 62, bottomBlockHeight: 600, cardAfterHeight: 260, accessibilitySize: true });
    expect(ax.k).toBe(0.69);
    expect(r1(ax.drawing.left)).toBe(127.2);
    expect(r1(ax.drawing.width)).toBe(r1(214 * 0.69));
    expect(r1(ax.drawing.height)).toBe(r1(324 * 0.69));
    expect(ax.drawing.top).toBeGreaterThanOrEqual(62);
    expect(ax.card.width).toBeNull();
    expect(ax.card.top).toBeGreaterThanOrEqual(ax.drawing.top + ax.drawing.height + 24 - 1e-9);
    expect(ax.bottomBlockTop).toBeGreaterThanOrEqual(ax.card.top + 260 + 24 - 1e-9);
    expect(ax.scrolls).toBe(true);
    const axShort = welcomeLayout({ width: 402, height: 874, safeTop: 62, bottomBlockHeight: 200, cardAfterHeight: 150, accessibilitySize: true });
    expect(axShort.k).toBe(0.69);
    expect(axShort.card.width).toBeNull();
    expect(axShort.scrolls).toBe(false);
  });
});

describe('OS2.1 · the Example check', () => {
  it('OS2.1 · the new intro, caption and bubble words', () => {
    expect(t('onb.example.intro')).toBe("Here's an example check. This is what you'll get.");
    expect(t('onb.example.note')).toBe('A drawn example, scored by the same code as your photos. Nothing was sent.');
    expect(strings['onb.example.a11yOutfit']).toBe('Drawn example outfit, {occasion}: {pieces}.');
    expect(drawnOutfitA11y(drawnPieces(demoReadingById('s14')!), 'Everyday')).toBe(
      'Drawn example outfit, Everyday: Charcoal denim jacket, White sweater, Grey drawstring trousers, Grey chunky sneakers.',
    );
    expect(t('onb.example.tag')).toBe('Example · Full');
    expect(t('onb.example.time')).toBe('Example');
    expect(t('onb.example.whyHide')).toBe('Hide the math');
    expect(t('onb.example.ctaOwn')).toBe('Check my own fit');
    expect(t('card.why', { score: '7.5' })).toBe('Why 7.5?');
    expect(t('card.nextLevel')).toBe('Next level');
    expect(t('card.gainTo', { score: '8.0' })).toBe('→ 8.0');
    // The old words are gone from every string.
    for (const v of Object.values(strings)) {
      expect(v).not.toMatch(/Here's a real check/);
      expect(v).not.toMatch(/A real photo, scored/);
    }
  });

  it("OS2.1 · the bubble tile's layout", () => {
    const want: Record<DrawnSlot, [number, number, number]> = { outer: [42, 2, 21], top: [53, 37, 13], bottom: [53, 37, 66], shoes: [61, 33, 109] };
    for (const s of SLOTS) {
      const p = tilePlacement(s, 127, 172);
      const [size, left, topY] = want[s];
      expect(Math.abs(p.size - size)).toBeLessThanOrEqual(1);
      expect(Math.abs(p.left - left)).toBeLessThanOrEqual(1);
      expect(Math.abs(p.top - topY)).toBeLessThanOrEqual(1);
    }
    expect(WELCOME_BOX).toEqual({ width: 214, height: 324 });
    expect(welcomePlacement('outer', 1)).toEqual({ size: 104, left: 0, top: 24 });
    expect(welcomePlacement('top', 1)).toEqual({ size: 134, left: 64, top: 0 });
    expect(welcomePlacement('bottom', 1)).toEqual({ size: 134, left: 64, top: 124 });
    expect(welcomePlacement('shoes', 1)).toEqual({ size: 150, left: 56, top: 204 });
    expect(welcomePlacement('outer', 0.5)).toEqual({ size: 52, left: 0, top: 12 });
    expect(welcomePlacement('top', 0.5)).toEqual({ size: 67, left: 32, top: 0 });
    expect(welcomePlacement('bottom', 0.5)).toEqual({ size: 67, left: 32, top: 62 });
    expect(welcomePlacement('shoes', 0.5)).toEqual({ size: 75, left: 28, top: 102 });
  });

  it("OS2.1 · the before card's content is the engine's", () => {
    const ex = exampleCheck()!;
    expect(ex.score).toBe(7.5);
    expect(ex.score).toBe(ev.row.score);
    expect(ex.summary).toBe('Good base. Swapping one piece gets you to 8.0.');
    expect(ex.summary).toBe(ev.row.explanation);
    expect(ex.fixes[0]!.copy).toBe('Swap the chunky sneakers for low-profile sneakers');
    expect(ex.fixes[0]!.tag).toBe('Raises Shoes to 8 · free if you own one');
    expect(ex.fixes[0]!.to).toBe(8);
    expect(ex.nextLevel).toBe('Clean chunky sneakers lift Shoes to 7.5. Not enough to move the score yet.');
    expect(ex.why!.strip.map((c) => [c.label, c.display, c.gain])).toEqual([
      ['Proportions', 8.5, false], ['Fit', 7, false], ['Color', 7, false], ['Shoes', 6.5, true], ['Style', 7.5, false],
    ]);
    expect(ex.why!.total).toBe(7.5);
    // It draws the reading it scored (the before state: the chunky sneakers).
    expect(readingOf(ex)).toBe(reading);
  });
});

describe('OS2.2 · nothing sent, nothing saved', () => {
  it('OS2.2 · computing the examples touches no store', async () => {
    const { createMemoryStore } = jest.requireActual<typeof import('@/data/memoryStore')>('@/data/memoryStore');
    const store = createMemoryStore();
    await store.init();
    const writes: string[] = [];
    const spyKv = jest.spyOn(store, 'setKv').mockImplementation(async (k) => void writes.push(`kv:${k}`));
    const spyDel = jest.spyOn(store, 'deleteKv').mockImplementation(async (k) => void writes.push(`kvdel:${k}`));
    const fetchMock = jest.fn(() => Promise.reject(new Error('T38 test: no network')));
    const realFetch = globalThis.fetch;
    globalThis.fetch = fetchMock as never;
    try {
      jest.isolateModules(() => {
        jest.doMock('@/data/db', () => ({ store }));
        const w = jest.requireActual<typeof import('@/features/onboarding/welcomeExample')>('@/features/onboarding/welcomeExample');
        const e = jest.requireActual<typeof import('@/features/onboarding/exampleCheck')>('@/features/onboarding/exampleCheck');
        // Fresh modules (nothing memoised yet), computed twice: still nothing written.
        expect(w.welcomeExample()).not.toBeNull();
        expect(e.exampleCheck()).not.toBeNull();
        w.welcomeExample();
        e.exampleCheck();
      });
      await Promise.resolve();
      expect(fetchMock).toHaveBeenCalledTimes(0);
      expect(writes).toEqual([]);
      expect(await store.fitChecks.all()).toEqual([]);
      expect(await store.chat.all()).toEqual([]);
      expect(await store.usage.all()).toEqual([]);
      expect(await store.closet.all()).toEqual([]);
      expect(await store.readings.all()).toEqual([]);
      expect(await store.getKv('onboarding.step')).toBeNull();
      expect(await store.getKv('reveal.fullShown')).toBeNull();
    } finally {
      globalThis.fetch = realFetch;
      spyKv.mockRestore();
      spyDel.mockRestore();
      jest.dontMock('@/data/db');
    }
  });
});
