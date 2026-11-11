// T38 · Nothing on Welcome or the Example check is typed in (tasks/T38/TESTING.md OS1.2 "the card shows whatever
// welcomeExample says"). For this file only, the bundled example reading is swapped for another bundled reading (s05),
// so the real engine gives other numbers, another fix and another swapped piece; both screens must show exactly those,
// computed here from the engine, and none of s14's (7.5, 8.0, Sharp, the sneaker swap).
//
// Profile (CLAUDE.md rule 6): s05 is a stock photo's bundled reading, "profile unknown", run with the same stated test
// profile as s14: occasion everyday, no picked looks, boldness null, an empty closet, a first check. No photo is used.
import { advance, allTexts, artIn, byId, expectNoPhoto, getId, mount, textAt, setUpT38Tests } from '@/testing/t38ScreenMocks';
import { applyPartsFix, type Fix, type Reading } from '@kitted/core';
import { displayScore, scoreWordLabel, spokenScore } from '@/design-system/score';
import { baseName } from '@/features/closet/itemName';
import { evaluateCheck, overallFor, scoreOptions } from '@/features/fitcheck/scoring';
import { drawnPieces, type DrawnSlot } from '@/features/onboarding/outfitDrawing';
import { ExampleCheckScreen } from '@/features/onboarding/ExampleCheckScreen';
import { WelcomeScreen } from '@/features/onboarding/WelcomeScreen';

jest.mock('@/services/readingSource/demoReadings', () => {
  const actual = jest.requireActual('@/services/readingSource/demoReadings');
  return { ...actual, demoReadingById: (id: string) => actual.demoReadingById(id === 's14' ? 's05' : id) };
});

setUpT38Tests();

// The engine's own answer for the swapped-in reading, computed here.
const { demoReadingById: realReading } = jest.requireActual<typeof import('@/services/readingSource/demoReadings')>('@/services/readingSource/demoReadings');
const reading = realReading('s05')!;
const ev = evaluateCheck({ reading, occasion: 'everyday', styles: [], boldness: null, closet: [], firstCheck: true });
const top = ev.row.fixes[0] as Fix;
const afterReading = applyPartsFix(reading, top)!;
const opts = scoreOptions({ occasion: 'everyday', styles: [], boldness: null });
const before = overallFor(reading, opts)!;
const after = overallFor(afterReading, opts)!;
const SLOT_OF: Record<string, DrawnSlot> = { outerwear: 'outer', top: 'top', bottom: 'bottom', footwear: 'shoes' };
const ORDER: DrawnSlot[] = ['outer', 'top', 'bottom', 'shoes'];
const changed = reading.garments
  .map((g, i) => (JSON.stringify(g) !== JSON.stringify(afterReading.garments[i]) ? SLOT_OF[String(g.category)] : undefined))
  .filter((s): s is DrawnSlot => s !== undefined);
const S14_WORDS = /7\.5|8\.0|Sharp|Swap the chunky sneakers|Raises Shoes to 8|chunky/;

it('OS1.2 · the card shows whatever welcomeExample says (nothing typed in)', async () => {
  // This file's premise: the swapped-in reading's own numbers, fix and swapped piece are unlike s14's.
  expect(ev.row.status).toBe('scored');
  expect(before).toBe(ev.row.score);
  expect(after).toBe(top.to);
  expect(changed).toHaveLength(1);
  expect(changed[0]).not.toBe('shoes');
  for (const s of [displayScore(before), displayScore(after), scoreWordLabel(before), scoreWordLabel(after), top.copy]) expect(s).not.toMatch(S14_WORDS);

  const label = `Example fit check. Everyday. ${spokenScore(before)} out of 10, ${scoreWordLabel(before)}. One fix: ${top.copy}. ${spokenScore(after)} out of 10, ${scoreWordLabel(after)}.`;
  await mount(<WelcomeScreen />);
  expect(textAt('welcome-card-score')).toBe(displayScore(before));
  expect(textAt('welcome-card-word-before')).toBe(scoreWordLabel(before));
  expect(textAt('welcome-card-detail-before')).toBe('Full check');
  expect(getId('welcome-card').props.accessibilityLabel).toBe(label);
  expect(allTexts().filter((x) => S14_WORDS.test(x))).toEqual([]);
  expectNoPhoto();
  // The count goes through every tenth of this reading's own gap.
  const seen: string[] = [textAt('welcome-card-score')];
  for (let tMs = 50; tMs <= 2050; tMs += 50) {
    await advance(50);
    const n = textAt('welcome-card-score');
    if (seen[seen.length - 1] !== n) seen.push(n);
  }
  const tenths = Math.round((after - before) * 10);
  expect(seen).toEqual(Array.from({ length: tenths + 1 }, (_, i) => (before + i / 10).toFixed(1)));
  expect(textAt('welcome-card-score')).toBe(displayScore(after));
  expect(textAt('welcome-card-word-after')).toBe(scoreWordLabel(after));
  expect(textAt('welcome-card-detail-after')).toBe(top.copy);
  expect(byId('welcome-card-word-before')).toBeNull();
  expect(byId('welcome-card-detail-before')).toBeNull();
  expect(getId('welcome-card').props.accessibilityLabel).toBe(label);
  expect(allTexts().filter((x) => S14_WORDS.test(x))).toEqual([]);
});

it("OS1.2 · the drawing swaps the piece this reading's fix changes, drawn from the scored reading", async () => {
  const slot = changed[0]!;
  const piecesBefore = drawnPieces(reading);
  const piecesAfter = drawnPieces(afterReading);
  // Only the slots the reading has (s05: no outer layer; its accessory isn't drawn).
  expect(piecesBefore.map((p) => p.slot)).toEqual(ORDER.filter((s) => reading.garments.some((g) => SLOT_OF[String(g.category)] === s)));
  const specBefore = piecesBefore.find((p) => p.slot === slot)!.spec;
  const specAfter = piecesAfter.find((p) => p.slot === slot)!.spec;
  await mount(<WelcomeScreen />);
  expect(artIn(byId('welcome-drawing'))).toHaveLength(piecesBefore.length);
  expect(artIn(byId('welcome-drawing'))).toEqual(expect.arrayContaining(piecesBefore.map((p) => p.spec)));
  expect(artIn(byId(`drawn-piece-${slot}`))).toEqual([specBefore]);
  expect(byId(`drawn-piece-${slot}-after`)).toBeNull();
  await advance(2050);
  expect(byId(`drawn-piece-${slot}`)).toBeNull();
  expect(artIn(byId(`drawn-piece-${slot}-after`))).toEqual([specAfter]);
  expect(byId('drawn-piece-shoes-after')).toBeNull();
  expect(artIn(byId('welcome-drawing'))).toHaveLength(piecesBefore.length);
  for (const p of piecesBefore.filter((x) => x.slot !== slot)) expect(artIn(byId(`drawn-piece-${p.slot}`))).toEqual([p.spec]);
});

it("OS2.1 · the Example check's bubble and card are the scored reading's", async () => {
  const names = ORDER.flatMap((s) => {
    const g = reading.garments.find((x) => SLOT_OF[String(x.category)] === s);
    return g ? [baseName(g, null)] : [];
  });
  await mount(<ExampleCheckScreen />);
  expect(getId('example-bubble').props.accessibilityLabel).toBe(`Drawn example outfit, Everyday: ${names.join(', ')}.`);
  expect(artIn(byId('example-bubble'))).toEqual(expect.arrayContaining(drawnPieces(reading as Reading).map((p) => p.spec)));
  expect(artIn(byId('example-bubble'))).toHaveLength(names.length);
  expect(getId('example-card').props.accessibilityLabel).toBe(
    `Example fit check. Everyday. Score ${spokenScore(before)} out of 10, ${scoreWordLabel(before)}. ${ev.row.explanation ?? ''}`,
  );
  expect(allTexts()).toEqual(expect.arrayContaining([`Why ${displayScore(before)}?`, top.copy, `→ ${displayScore(top.to)}`]));
  expect(allTexts().filter((x) => /Swap the chunky sneakers|Raises Shoes to 8|Why 7\.5\?/.test(x))).toEqual([]);
  expectNoPhoto();
});
