import crops from '../../assets/demo-photos/demo-photos.json';
import { neckDownLayout } from '@/design-system/components/Chat';

const crop = (id: string) => {
  const c = crops.photos.find((p) => p.id === id);
  if (!c) throw new Error(`no crop for ${id}`);
  return c;
};

describe('neckDownLayout (mockup placePhoto, mode "neck")', () => {
  it('p01b in the 127 × 172 bubble', () => {
    const box = neckDownLayout(crop('p01b'), 546 / 820, 127, 172);
    expect(box.height).toBeCloseTo(252.2, 1);
    expect(box.left).toBeCloseTo(-20.5, 1);
    expect(box.top).toBeCloseTo(-79.4, 1);
  });

  it('s24 clamps so no strip shows under the feet', () => {
    const box = neckDownLayout(crop('s24'), 543 / 820, 127, 172);
    expect(box.top).toBeCloseTo(172 - box.height, 5);
    expect(box.top).toBeCloseTo(-73.0, 1);
  });

  it('never exposes an image edge for any demo photo, in any box', () => {
    const sizes: Record<string, [number, number]> = { s25: [461, 820], s05: [656, 820], s22: [615, 820] };
    for (const p of crops.photos) {
      const [w, h] = sizes[p.id] ?? [546, 820];
      for (const [W, H] of [[127, 172], [44, 44], [354, 480]] as const) {
        const b = neckDownLayout(p, w / h, W, H);
        expect(b.left).toBeLessThanOrEqual(0);
        expect(b.top).toBeLessThanOrEqual(0);
        expect(b.left + b.width).toBeGreaterThanOrEqual(W - 1e-9);
        expect(b.top + b.height).toBeGreaterThanOrEqual(H - 1e-9);
      }
    }
  });
});
