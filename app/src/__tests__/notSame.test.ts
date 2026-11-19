// CB4 (specs/closet-beta.md): the pure rules of "What is it, then?": which pieces, in what order, which kinds.
import type { ClosetItemRow } from '@/data/types';
import { editOptions, isOffered } from '@/features/closet/pieceEdit';
import { kindChoices, KIND_SHORTLIST, notSameContent } from '@/features/closet/notSame';
import { answerLine } from '@/features/closet/answerToast';

const piece = (id: string, o: Partial<ClosetItemRow> & { sub?: string; color?: string } = {}): ClosetItemRow => ({
  id, name: o.name ?? id, slot: 'top', garment: { category: 'top', subcategory: o.sub ?? 'sweater', color_family: o.color ?? 'grey' },
  hex: '#888', confirmedFields: [], photoFile: null, demoPhotoId: null, isPhotographed: true, source: 'photo', starterId: null, wornCount: 1,
  lastWornAt: null, addedAt: 1, isDeleted: false, mergedInto: null, maybeSameAs: null, updatedAt: 1, ...o,
} as unknown as ClosetItemRow);

const photo = piece('P', { name: 'Grey crewneck sweater', maybeSameAs: 'A', addedAt: 99 });
const A = piece('A', { addedAt: 10 }), B = piece('B', { addedAt: 30 }), C = piece('C', { addedAt: 20 });
const shoe = piece('S', { slot: 'shoes', addedAt: 50 } as never);

describe('CB4.2 / CB4.3 · the pieces he can point at', () => {
  it('only his own pieces of the photographed slot, never the refused one, the photo itself or another slot', () => {
    const c = notSameContent(photo, [photo, A, B, C, shoe], { candidateId: 'A' });
    expect(c.pieces.map((p) => p.id)).toEqual(['B', 'C']);
    expect(c.empty).toBe(false);
  });

  it('the runner-up first, then newest first', () => {
    const c = notSameContent(photo, [photo, A, B, C], { candidateId: 'A', runnerUpId: 'C' });
    expect(c.pieces.map((p) => p.id)).toEqual(['C', 'B']);
    expect(notSameContent(photo, [photo, A, B, C], { candidateId: 'A' }).pieces.map((p) => p.id)).toEqual(['B', 'C']);
  });

  it('a piece still waiting on an answer, or removed, is not listed', () => {
    const waiting = piece('W', { maybeSameAs: 'B', addedAt: 40 });
    const gone = piece('G', { isDeleted: true, addedAt: 41 });
    const c = notSameContent(photo, [photo, A, B, waiting, gone], { candidateId: 'A' });
    expect(c.pieces.map((p) => p.id)).toEqual(['B']);
  });

  it('CB4.8 · nothing else in the slot is the empty case', () => {
    const c = notSameContent(photo, [photo, A, shoe], { candidateId: 'A' });
    expect([c.pieces, c.empty]).toEqual([[], true]);
  });

  it('a matched sighting: the piece it matched is the one left out', () => {
    const c = notSameContent(A, [A, B, C], null, ['A']);
    expect(c.pieces.map((p) => p.id)).toEqual(['B', 'C']);
  });
});

describe('CB4.6 / CB4.14 · the kinds', () => {
  it('2 to 4 kinds of the slot, the kind the app read first', () => {
    const k = kindChoices(piece('Q', { sub: 'quarter_zip' }));
    expect(k).toEqual(['quarter_zip', 'tee', 'sweater', 'button_up_shirt']);
    expect(kindChoices(photo)).toEqual(['sweater', 'tee', 'button_up_shirt', 'hoodie']);
    for (const slot of ['top', 'outer', 'bottom', 'shoes'] as const) {
      expect(KIND_SHORTLIST[slot].length).toBeGreaterThanOrEqual(2);
      expect(kindChoices({ ...photo, slot, garment: { ...photo.garment, subcategory: undefined as never } }).length).toBeLessThanOrEqual(4);
    }
  });

  it('every offered kind is one What it is → Kind offers for that slot, and the full list is that same list', () => {
    for (const slot of ['top', 'outer', 'bottom', 'shoes'] as const) {
      const p = piece('X', { slot, sub: slot === 'bottom' ? 'jeans' : slot === 'shoes' ? 'loafer' : slot === 'outer' ? 'bomber' : 'tee' });
      for (const k of kindChoices(p)) expect([slot, k, isOffered(p, 'kind', k) || k === (p.garment.subcategory as string)]).toEqual([slot, k, true]);
      const all = editOptions(p, 'kind');
      expect([...all.main, ...all.more].length).toBeGreaterThan(KIND_SHORTLIST[slot].length - 1);
    }
  });
});

describe('the card and toast lines', () => {
  it('a picked piece reads as Saved as your {item}; a new piece with its kind as its own piece; old answers as before', () => {
    expect(answerLine('same', A, null, { picked: B })).toBe('Saved as your b.');
    expect(answerLine('new', A, null, { newPiece: { name: 'Grey sweater' } })).toBe('Saved as its own piece: grey sweater.');
    expect(answerLine('new', A, null)).toBe('Kept as a new piece.');
  });
});
