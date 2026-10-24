// The piece peek (09-ui-review §28.4, #371), checks written before the build: a fix row that names a closet piece
// shows that piece on a tap; the card's VoiceOver actions say "Show your …".
import type { ClosetItemRow } from '@/data/types';
import { fixPiece, peekActions, peekFrame, peekLines, peekWidth, PEEK_GAP, PEEK_GUTTER, PEEK_MAX_W } from '@/features/stylist/cards/fixPeek';

const item = (id: string, name: string): ClosetItemRow =>
  ({ id, name, slot: 'shoes', wornCount: 4, isDeleted: false, mergedInto: null, garment: {}, hex: '#F0E9D9' } as unknown as ClosetItemRow);
const cream = item('C-cream', 'Cream chunky sneakers');
const sweat = { ...item('C-sweat', 'Green Champion sweatshirt'), slot: 'top' } as ClosetItemRow;
const gone = { ...item('C-gone', 'Grey work boots'), isDeleted: true } as ClosetItemRow;
const dup = { ...item('C-dup', 'Cream chunky sneakers 2'), isDeleted: true, mergedInto: 'C-cream' } as ClosetItemRow;
const closet = [cream, sweat, gone, dup];

describe('PK1 · which piece a fix row shows', () => {
  it('the live closet piece; a merged one shows the piece it lives in now', () => {
    expect(fixPiece({ itemId: 'C-cream' }, closet)?.id).toBe('C-cream');
    expect(fixPiece({ itemId: 'C-dup' }, closet)?.id).toBe('C-cream');
  });
  it('none for a removed piece, a generic fix ("free if you own one") or a free move', () => {
    expect(fixPiece({ itemId: 'C-gone' }, closet)).toBeNull();
    expect(fixPiece({ itemId: null }, closet)).toBeNull();
    expect(fixPiece({}, closet)).toBeNull();
    expect(fixPiece({ itemId: 'C-nowhere' }, closet)).toBeNull();
  });
  it('a merge loop never hangs', () => {
    const a = { ...item('A', 'a'), isDeleted: true, mergedInto: 'B' } as ClosetItemRow;
    const b = { ...item('B', 'b'), isDeleted: true, mergedInto: 'A' } as ClosetItemRow;
    expect(fixPiece({ itemId: 'A' }, [a, b])).toBeNull();
  });
});

describe('PK2 · where the peek goes', () => {
  const win = { width: 402, height: 874 };
  const insets = { top: 62, bottom: 34 };
  it('above the row when it fits under the top inset, centered and as wide as allowed', () => {
    const f = peekFrame({ x: 32, y: 500, w: 338, h: 56 }, 220, win, insets);
    expect(f.above).toBe(true);
    expect(f.y).toBe(500 - PEEK_GAP - 220);
    expect(f.w).toBe(PEEK_MAX_W);
    expect(f.x).toBeCloseTo(32 + 338 / 2 - PEEK_MAX_W / 2);
  });
  it('below the row when there is no room above', () => {
    const f = peekFrame({ x: 32, y: 180, w: 338, h: 56 }, 220, win, insets);
    expect(f.above).toBe(false);
    expect(f.y).toBe(180 + 56 + PEEK_GAP);
  });
  it('never off screen sideways, on a narrow phone and at the largest text size (a tall peek)', () => {
    const narrow = { width: 320, height: 568 };
    for (const row of [{ x: 0, y: 400, w: 40, h: 90 }, { x: 280, y: 400, w: 40, h: 90 }, { x: 16, y: 120, w: 288, h: 140 }]) {
      const f = peekFrame(row, 360, narrow, { top: 20, bottom: 0 });
      expect(f.x).toBeGreaterThanOrEqual(PEEK_GUTTER);
      expect(f.x + f.w).toBeLessThanOrEqual(narrow.width - PEEK_GUTTER);
      expect(f.y).toBeGreaterThanOrEqual(20 + PEEK_GUTTER);
    }
  });
});

describe('PK2b · the largest text sizes (found on the Simulator, Oct 24)', () => {
  const win = { width: 402, height: 874 };
  const insets = { top: 62, bottom: 34 };
  it('the peek takes the whole width inside the gutters, so "Open piece" stays on one line', () => {
    expect(peekWidth(402, true)).toBe(402 - PEEK_GUTTER * 2);
    expect(peekWidth(402, false)).toBe(PEEK_MAX_W);
    expect(peekFrame({ x: 32, y: 500, w: 338, h: 56 }, 220, win, insets, peekWidth(402, true)).x).toBe(PEEK_GUTTER);
  });
  it('a row too tall for the peek on either side: kept on screen over the row, with no pointer at the wrong spot', () => {
    const f = peekFrame({ x: 32, y: 120, w: 338, h: 390 }, 450, win, insets);
    expect(f.pointer).toBe(false);
    expect(f.y + 450).toBeLessThanOrEqual(win.height - insets.bottom - PEEK_GUTTER);
    expect(peekFrame({ x: 32, y: 500, w: 338, h: 56 }, 220, win, insets).pointer).toBe(true);
    expect(peekFrame({ x: 32, y: 180, w: 338, h: 56 }, 220, win, insets).pointer).toBe(true);
  });
});

describe('PK3 · what the peek says', () => {
  it('the name, "Worn 4 times" / "Worn 1 time", nothing before he has worn it, and Open piece', () => {
    expect(peekLines(cream)).toEqual({ name: 'Cream chunky sneakers', worn: 'Worn 4 times', open: 'Open piece' });
    expect(peekLines({ ...cream, wornCount: 1 }).worn).toBe('Worn 1 time');
    expect(peekLines({ ...cream, wornCount: 0 }).worn).toBeNull();
  });
});

describe('PK4 · VoiceOver on the card', () => {
  it('one "Show your …" per closet piece, none for a generic fix, no repeats', () => {
    const fixes = [{ itemId: 'C-sweat' }, { itemId: 'C-cream' }, { itemId: null }, { itemId: 'C-dup' }];
    expect(peekActions(fixes, closet).map((a) => a.label)).toEqual(['Show your green Champion sweatshirt', 'Show your cream chunky sneakers']);
    expect(peekActions([{ itemId: null }], closet)).toEqual([]);
  });
});
