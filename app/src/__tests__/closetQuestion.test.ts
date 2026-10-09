// The closet question card (#117): the crop never shows anything above the piece (a face never appears), and the
// reason line says why in plain words.
import { askQuestionText, askReasonText } from '@/features/closet/askText';
import { cropLayout } from '@/features/closet/cropLayout';

describe('cropLayout', () => {
  // His Oct 8 boxes: the hoodie under the cream shirt (a strip), the hoodie alone, the jeans, the boots (wide and low),
  // and his Oct 8 boots from the mirror (both feet, floor between them; the tile showed only the floor, #183).
  const boxes = [[347, 375, 571, 483], [334, 362, 568, 622], [546, 399, 821, 603], [805, 365, 863, 570], [894, 375, 977, 620]];
  for (const box of boxes) {
    for (const [w, h] of [[150, 172], [120, 138], [300, 120], [128, 128]]) {
      it(`box ${box.join(',')} in ${w}×${h}: nothing above the piece's top, the whole piece in view`, () => {
        const { imgW, imgH, left, top, hideAbove } = cropLayout(box, 0.75, w!, h!);
        // The photo's y (0–1) at the first row that isn't painted solid: never above the piece's top.
        expect((hideAbove - top) / imgH).toBeGreaterThanOrEqual(box[0]! / 1000 - 1e-9);
        // The piece's full width shows (both shoes, not the floor between them).
        expect(left + (box[1]! / 1000) * imgW).toBeGreaterThanOrEqual(-1e-9);
        expect(left + (box[3]! / 1000) * imgW).toBeLessThanOrEqual(w! + 1e-9);
        // The photo spans the frame's width; it covers the whole frame unless the region is wider than the frame.
        expect(left).toBeLessThanOrEqual(1e-9);
        expect(left + imgW).toBeGreaterThanOrEqual(w! - 1e-9);
        if (hideAbove === 0) {
          expect(top).toBeLessThanOrEqual(1e-9);
          expect(top + imgH).toBeGreaterThanOrEqual(h! - 1e-9);
        }
      });
    }
  }
  it('a pair of shoes is fitted to the width, not zoomed into the floor between them', () => {
    const { hideAbove, piece } = cropLayout([894, 375, 977, 620], 0.75, 128, 128);
    expect(hideAbove).toBeGreaterThan(0);
    expect(piece.right - piece.left).toBeGreaterThan(0.6 * 128);
  });
});

describe('askReasonText', () => {
  it('names the layer, the type with its article, or falls back', () => {
    expect(askReasonText({ reason: 'halfSeen', reasonWord: 'overshirt' })).toBe('I could only see part of it under your overshirt.');
    expect(askReasonText({ reason: 'halfSeen', reasonWord: null })).toBe('I could only see part of it in this photo.');
    expect(askReasonText({ reason: 'type', reasonWord: 'sweatshirt' })).toBe('It looked like a sweatshirt in this photo.');
    expect(askReasonText({ reason: 'type', reasonWord: 'overshirt' })).toBe('It looked like an overshirt in this photo.');
    expect(askReasonText({ reason: 'shoes' })).toBe('Your shoes were small in this photo.');
    expect(askReasonText({})).toBe('They look a lot alike.');
    expect(askReasonText({ reason: 'halfSeen', reasonWord: 'overshirt' }, true)).toBe('I could only see part of them under your overshirt.');
    expect(askReasonText({ reason: 'type', reasonWord: 'sweatpants' }, true)).toBe('They looked like sweatpants in this photo.');
  });
  it('pants and shoes are "these"', () => {
    expect(askQuestionText('khaki chinos', 'bottom')).toBe('Are these your khaki chinos?');
    expect(askQuestionText('grey work boots', 'shoes')).toBe('Are these your grey work boots?');
    expect(askQuestionText('grey Nike hoodie', 'top')).toBe('Is this your grey Nike hoodie?');
  });
});
