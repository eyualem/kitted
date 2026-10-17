// 07 §19 (#319): the open composer's words showed blurred. The tab bar (and its bottom accessory's glass capsule) is
// drawn above the Stylist screen, so the accessory lensed the composer resting under it. The look is checked on the
// Simulator (K1–K6); what keeps it fixed is read from the source here.
declare const __dirname: string;
const { readFileSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');
const src = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');

describe('K · nothing draws over the open composer', () => {
  const layout = src('app/(tabs)/_layout.tsx');

  it('the accessory leaves the tab bar while the composer is open', () => {
    expect(layout).toMatch(/const composerOpen = useComposerOpen\(\) !== null;/);
    expect(layout).toMatch(/\{onThread && !composerOpen \? \(\s*<NativeTabs\.BottomAccessory>/);
  });

  it('opened from the bar, the field asks for focus again if the first ask was refused', () => {
    const c = src('features/stylist/Composer.tsx');
    const retry = c.slice(c.indexOf('if (!autoFocus) return;'), c.indexOf('const cursorNext'));
    expect(retry).toMatch(/setTimeout\(/);
    expect(retry).toMatch(/!used\.current && field\.current && !field\.current\.isFocused\(\)\) field\.current\.focus\(\)/);
    expect(retry).toMatch(/clearTimeout\(id\)/);
  });
});
