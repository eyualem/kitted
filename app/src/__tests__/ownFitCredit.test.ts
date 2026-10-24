// His own good fit, credited on a later card (founder, Oct 23, #370): when a fit he chose himself (not the card's pick)
// scored 8+, the next card that reuses one of its pieces says so in its why line ("Your olive overshirt was in
// Tuesday's 8.0."). Never in the greeting, never for the card's own pick, never a score that went down to get there.
// Read at display time from the rows as they are; nothing stored changes. Nothing calls Google.
import { US_EASTERN } from '@kitted/core';
import seed from '../../assets/seed.json';
import type { ClosetItemRow, DailyIdeaRow, FitCheckRow } from '@/data/types';
import { creditLine, CREDIT_DAYS, CREDIT_MIN, ownFitCredit } from '@/features/morning/ownFitCredit';

const at = (iso: string) => Date.parse(iso);
const CLOSET = seed.scenarios.full.closet as unknown as ClosetItemRow[];
const check = (id: string, iso: string, itemIds: string[], score: number | null, parentId: string | null = null): FitCheckRow =>
  ({ id, dayKey: iso.slice(0, 10), createdAt: at(iso), status: 'scored', itemIds, score, parentId } as unknown as FitCheckRow);
const idea = (day: string, slot: 'day' | 'evening', outfitId: string | null): DailyIdeaRow =>
  ({ id: `${day}|${slot}`, dayKey: day, slot, outfitId } as unknown as DailyIdeaRow);

// Today is Friday Oct 23; the card puts the olive overshirt over the white tee, dark jeans and white sneakers.
const CARD: { id: string; slot: 'day' | 'evening'; itemIds: string[] } = { id: '2026-10-23|day', slot: 'day', itemIds: ['L2', 'T1', 'B3', 'S1'] };
const OWN = ['L2', 'T5', 'B1', 'S4']; // Tuesday: olive overshirt, black tee, khaki chinos, Chelsea boots
const rows = (checks: FitCheckRow[], ideas: DailyIdeaRow[] = [], outfits: Record<string, string[]> = {}) =>
  ({ checks, ideas, closet: CLOSET, itemsOf: (id: string) => outfits[id] ?? [] });
const credit = (checks: FitCheckRow[], ideas?: DailyIdeaRow[], outfits?: Record<string, string[]>, card = CARD) =>
  ownFitCredit(card, rows(checks, ideas, outfits), US_EASTERN);

describe('O1 · his own 8+ fit, sharing a piece, is credited', () => {
  it("Tuesday's own 8.0 with the olive overshirt: the card names the overshirt and Tuesday", () => {
    const c = credit([check('C', '2026-10-20T08:30:00-04:00', OWN, 8)]);
    expect(c).toMatchObject({ itemId: 'L2', checkId: 'C', score: 8 });
    expect(creditLine(c!, CARD, CLOSET, US_EASTERN)).toBe("Your olive overshirt was in Tuesday's 8.0.");
  });

  it(`below ${CREDIT_MIN} says nothing`, () => {
    expect(credit([check('C', '2026-10-20T08:30:00-04:00', OWN, 7.5)])).toBeNull();
  });

  it('no shared piece says nothing', () => {
    expect(credit([check('C', '2026-10-20T08:30:00-04:00', ['T5', 'B1', 'S4'], 8.5)])).toBeNull();
  });
});

describe("O2 · only his own fit, not the card's pick", () => {
  const PICK = ['L2', 'T5', 'B1', 'S4'];
  it("a check that shows that day's card pick isn't his own", () => {
    expect(credit([check('C', '2026-10-20T08:30:00-04:00', OWN, 8)], [idea('2026-10-20', 'day', 'O1')], { O1: PICK })).toBeNull();
  });

  it("a check that isn't that day's pick is", () => {
    const other = { O1: ['L1', 'T3', 'B2', 'S2'] };
    expect(credit([check('C', '2026-10-20T08:30:00-04:00', OWN, 8)], [idea('2026-10-20', 'day', 'O1')], other)).not.toBeNull();
  });

  it("the evening card's pick doesn't decide a morning check", () => {
    expect(credit([check('C', '2026-10-20T08:30:00-04:00', OWN, 8)], [idea('2026-10-20', 'evening', 'O1')], { O1: PICK })).not.toBeNull();
  });
});

describe('O3 · what he wore, when', () => {
  it('a try-on followed by another outfit within the hour is not credited', () => {
    const tried = check('A', '2026-10-20T08:00:00-04:00', OWN, 8.5);
    const wore = check('B', '2026-10-20T08:30:00-04:00', ['T2', 'B3', 'S3'], 7);
    expect(credit([tried, wore])).toBeNull();
  });

  it("a re-check that took it to 8 is credited with the re-check's score", () => {
    const first = check('A', '2026-10-20T08:00:00-04:00', OWN, 7);
    const re = check('B', '2026-10-20T08:10:00-04:00', OWN, 8, 'A');
    expect(credit([first, re])).toMatchObject({ checkId: 'B', score: 8 });
  });

  it(`older than ${CREDIT_DAYS} days, or in this card's own window, says nothing`, () => {
    expect(credit([check('C', '2026-10-16T08:30:00-04:00', OWN, 8)])).toBeNull();
    expect(credit([check('C', '2026-10-23T08:30:00-04:00', OWN, 8)])).toBeNull();
  });

  it('a check with no score or not scored says nothing', () => {
    const held = { ...check('C', '2026-10-20T08:30:00-04:00', OWN, null), status: 'held' } as FitCheckRow;
    expect(credit([held])).toBeNull();
  });

  it('the newest qualifying check wins', () => {
    const tue = check('A', '2026-10-20T08:30:00-04:00', OWN, 8.5);
    const thu = check('B', '2026-10-22T08:30:00-04:00', ['T1', 'B1', 'S4'], 8);
    expect(credit([tue, thu])).toMatchObject({ checkId: 'B', itemId: 'T1' });
  });
});

describe('O4 · which piece, and the words', () => {
  it('the layer leads, then the top, the pants, the shoes', () => {
    expect(credit([check('C', '2026-10-20T08:30:00-04:00', ['T1', 'B3', 'S1'], 8)])).toMatchObject({ itemId: 'T1' });
    expect(credit([check('C', '2026-10-20T08:30:00-04:00', ['T5', 'B3', 'S1'], 8)])).toMatchObject({ itemId: 'B3' });
  });

  it('a piece merged into a card piece after the check still matches', () => {
    const closet = [...CLOSET, { ...CLOSET.find((c) => c.id === 'L2')!, id: 'L2_DUP', mergedInto: 'L2', isDeleted: true }];
    const c = ownFitCredit(CARD, { checks: [check('C', '2026-10-20T08:30:00-04:00', ['L2_DUP', 'T5'], 8)], ideas: [], closet, itemsOf: () => [] }, US_EASTERN);
    expect(c).toMatchObject({ itemId: 'L2' });
  });

  it("yesterday, last night, this morning", () => {
    const yest = credit([check('C', '2026-10-22T09:00:00-04:00', OWN, 8)])!;
    expect(creditLine(yest, CARD, CLOSET, US_EASTERN)).toBe("Your olive overshirt was in yesterday's 8.0.");
    const night = credit([check('C', '2026-10-22T20:00:00-04:00', OWN, 8.5)])!;
    expect(creditLine(night, CARD, CLOSET, US_EASTERN)).toBe("Your olive overshirt was in last night's 8.5.");
    const evening = { id: '2026-10-23|evening', slot: 'evening' as const, itemIds: CARD.itemIds };
    const morning = credit([check('C', '2026-10-23T08:30:00-04:00', OWN, 8)], [], {}, evening)!;
    expect(creditLine(morning, evening, CLOSET, US_EASTERN)).toBe("Your olive overshirt was in this morning's 8.0.");
    const afternoon = credit([check('C', '2026-10-23T14:00:00-04:00', OWN, 8)], [], {}, evening)!;
    expect(creditLine(afternoon, evening, CLOSET, US_EASTERN)).toBe("Your olive overshirt was in this afternoon's 8.0.");
  });
});
