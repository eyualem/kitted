// The web demo's icons (Icon.web.tsx): every canonical symbol, and every raw SF Symbol name the app passes to <Icon>,
// has a drawn glyph, so no icon is an empty box on the web. (iOS draws real SF Symbols through Icon.tsx.)
import { sym } from '@/design-system/symbols';
import { glyphs } from '@/design-system/components/Icon.web';

// Raw names the app passes straight to <Icon> (not through `sym`), found by grepping the code: the composer's mic and
// arrows, the consent screen's pictures, the Go-for tag, the weather strip's symbols, the sign-in mark, the menu lines.
const RAW = [
  'mic', 'arrow.up', 'arrow.down', 'arrow.left', 'arrow.right', 'chevron.up', 'chevron.down', 'line.3.horizontal', 'apple.logo', 'tag', 'location',
  'face.dashed', 'hand.raised', 'iphone', 'info.circle', 'cloud', 'cloud.rain', 'cloud.snow', 'cloud.fog', 'wind', 'moon.stars', 'sun.max',
];

describe('web icon glyphs', () => {
  it('draws every canonical symbol', () => {
    const missing = Object.entries(sym).filter(([, name]) => !glyphs[name]).map(([key, name]) => `${key} (${name})`);
    expect(missing).toEqual([]);
  });
  it('draws every raw name the app uses', () => {
    expect(RAW.filter((n) => !glyphs[n])).toEqual([]);
  });
});
