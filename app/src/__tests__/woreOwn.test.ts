// "Wear this", then a fit check in something else (#369), written from the founder's Oct 22 evening: he tapped Wear this
// on the card (olive fleece, charcoal tee, washed black jeans, cream chunky sneakers), then checked a black hoodie, the
// same jeans and black running shoes. The card said "You wore my pick" and the next cards counted the fleece and the
// chunky sneakers as worn. Now the check is what he wore. Scores never change. Nothing calls Google.
import { US_EASTERN } from '@kitted/core';
import seed from '../../assets/seed.json';
import type { ClosetItemRow, FitCheckRow, WearLogRow } from '@/data/types';
import { historyFor, slotAt } from '@/features/morning/service';
import { PICK_SHARE, wearOverridden, woreThePick } from '@/features/morning/woreOwn';

const at = (iso: string) => Date.parse(iso);
const CLOSET = seed.scenarios.full.closet as unknown as ClosetItemRow[];
const check = (id: string, iso: string, itemIds: string[]): FitCheckRow =>
  ({ id, dayKey: iso.slice(0, 10), createdAt: at(iso), status: 'scored', itemIds } as unknown as FitCheckRow);
const wear = (iso: string, outfitId: string): WearLogRow => ({ day: iso.slice(0, 10), fitCheckId: null, outfitId, createdAt: at(iso) });
const slotOf = (ms: number) => slotAt(ms, US_EASTERN).slot;

const PICK = ['FLEECE', 'CHARCOAL_TEE', 'BLACK_JEANS', 'CREAM_CHUNKY'];
const HIS_CHECK = ['BLACK_HOODIE', 'BLACK_JEANS', 'BLACK_RUNNERS'];

describe('W1 · does the check show the pick?', () => {
  it('his Oct 22 check shares only the jeans: he went with his own', () => {
    expect(woreThePick(PICK, HIS_CHECK, [])).toBe(false);
  });

  it(`the pick worn without one piece (3 of 4, ≥ ${PICK_SHARE}) still is the pick; 2 of 4 isn't`, () => {
    expect(woreThePick(PICK, ['CHARCOAL_TEE', 'BLACK_JEANS', 'CREAM_CHUNKY'], [])).toBe(true);
    expect(woreThePick(PICK, ['FLEECE', 'BLACK_JEANS', 'BLACK_RUNNERS'], [])).toBe(false);
  });

  it('a piece merged into another after the check still matches', () => {
    const merged = [{ id: 'CREAM_CHUNKY_DUP', mergedInto: 'CREAM_CHUNKY' }] as Pick<ClosetItemRow, 'id' | 'mergedInto'>[];
    expect(woreThePick(PICK, ['FLEECE', 'CHARCOAL_TEE', 'BLACK_JEANS', 'CREAM_CHUNKY_DUP'], merged)).toBe(true);
  });

  it('a check whose pieces aren\'t in yet, or a pick with none, says nothing against the pick', () => {
    expect(woreThePick(PICK, [], [])).toBe(true);
    expect(woreThePick([], HIS_CHECK, [])).toBe(true);
  });
});

describe('W2 · a Wear this the checks contradict', () => {
  const w = wear('2026-10-22T21:16:00-04:00', 'PICK');

  it('a worn check after it, the same evening, that isn\'t the pick overrides it', () => {
    expect(wearOverridden(w, PICK, [check('C', '2026-10-22T21:16:19-04:00', HIS_CHECK)], [], slotOf)).toBe(true);
  });

  it('a check that is the pick, one before it, one in the other part of the day, or a try-on doesn\'t', () => {
    expect(wearOverridden(w, PICK, [check('C', '2026-10-22T21:20:00-04:00', PICK)], [], slotOf)).toBe(false);
    expect(wearOverridden(w, PICK, [check('C', '2026-10-22T21:00:00-04:00', HIS_CHECK)], [], slotOf)).toBe(false);
    const morningWear = wear('2026-10-22T08:00:00-04:00', 'PICK');
    expect(wearOverridden(morningWear, PICK, [check('C', '2026-10-22T21:16:19-04:00', HIS_CHECK)], [], slotOf)).toBe(false);
    // A different outfit he tried on, then the pick: the pick is what he wore.
    const tried = check('A', '2026-10-22T21:20:00-04:00', HIS_CHECK);
    const wore = check('B', '2026-10-22T21:40:00-04:00', PICK);
    expect(wearOverridden(w, PICK, [tried, wore], [], slotOf)).toBe(false);
  });

  it('a check with no pieces yet (or a failed photo) doesn\'t override it', () => {
    expect(wearOverridden(w, PICK, [check('C', '2026-10-22T21:16:19-04:00', [])], [], slotOf)).toBe(false);
  });
});

describe('W3 · the next cards (and Kit) count what he wore, not the pick', () => {
  const rows = (wears: WearLogRow[], checks: FitCheckRow[]) =>
    ({ ideas: [], wears, checks, closet: CLOSET, itemsOf: (id: string) => (id === 'PICK' ? PICK : []) });
  const next = { id: '2026-10-23|day', slot: 'day' as const };

  it('his evening: the hoodie, jeans and runners count; the fleece and the cream chunky sneakers don\'t', () => {
    const h = historyFor(next, rows([wear('2026-10-22T21:14:30-04:00', 'PICK')], [check('C', '2026-10-22T21:16:19-04:00', HIS_CHECK)]), US_EASTERN);
    expect(h.items.get('BLACK_HOODIE')).toBe(1);
    expect(h.items.get('BLACK_JEANS')).toBe(1);
    expect(h.items.has('FLEECE')).toBe(false);
    expect(h.items.has('CREAM_CHUNKY')).toBe(false);
  });

  it('when the check is the pick, or there is no check, the pick counts as before', () => {
    const same = historyFor(next, rows([wear('2026-10-22T21:14:30-04:00', 'PICK')], [check('C', '2026-10-22T21:16:19-04:00', PICK)]), US_EASTERN);
    expect(same.items.get('FLEECE')).toBe(1);
    const none = historyFor(next, rows([wear('2026-10-22T21:14:30-04:00', 'PICK')], []), US_EASTERN);
    expect(none.items.get('CREAM_CHUNKY')).toBe(1);
  });
});

