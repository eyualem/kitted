// His photo in the chat (founder, Nov 12, "Bigger, no frame"): about 60% of the screen wide, no frame, the caption under it.
// The look is checked on the Simulator (tasks/chat-photo/shots); the sizes and what keeps the frame gone are read here.
import { PHOTO_BUBBLE_MAX_WIDTH, photoBubbleSize } from '@/design-system/components/chatLayout';

declare const __dirname: string;
const { readFileSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');
const src = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');

describe('photoBubbleSize', () => {
  it('is 60% of the screen wide', () => {
    expect(photoBubbleSize(402).width).toBe(241);
    expect(photoBubbleSize(375).width).toBe(225);
  });

  it('is capped on a wide screen', () => {
    expect(photoBubbleSize(1024).width).toBe(PHOTO_BUBBLE_MAX_WIDTH);
  });

  it('takes its height from the photo shape, kept between 1.2 and 1.45 times the width', () => {
    expect(photoBubbleSize(402, 127 / 172).height).toBe(Math.round(241 * (172 / 127)));
    expect(photoBubbleSize(402, 0.5).height).toBe(Math.round(241 * 1.45));
    expect(photoBubbleSize(402, 1.2).height).toBe(Math.round(241 * 1.2));
  });

  it('falls back to the old tile shape when the photo gives none', () => {
    expect(photoBubbleSize(402)).toEqual(photoBubbleSize(402, 127 / 172));
    expect(photoBubbleSize(402, 0)).toEqual(photoBubbleSize(402, 127 / 172));
    expect(photoBubbleSize(402, Number.NaN)).toEqual(photoBubbleSize(402, 127 / 172));
  });
});

describe('PhotoBubble has no frame', () => {
  const chat = src('design-system/components/Chat.tsx');
  const bubble = chat.slice(chat.indexOf('export function PhotoBubble'), chat.indexOf('export function DayStamp'));

  it('draws no `me` fill and no padding behind the photo', () => {
    expect(bubble).not.toMatch(/colors\.me\b/);
    expect(bubble).not.toMatch(/padding: 4/);
    expect(bubble).not.toMatch(/size\.photoBubble/);
  });

  it('keeps the small tail corner bottom-right and its caption right-aligned in grey under the photo', () => {
    expect(bubble).toMatch(/br: radius\.bubbleTail/);
    expect(bubble).toMatch(/role="dayStamp"/);
    expect(bubble).toMatch(/textAlign: 'right'/);
  });

  it('does not cut the caption (no numberOfLines) and keeps the photo tappable', () => {
    expect(bubble).not.toMatch(/numberOfLines/);
    expect(bubble).toMatch(/onPress=\{onPress\}/);
  });
});
