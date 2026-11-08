// 09 §29 (#380): two small fixes from the walk of the founder's Oct 24 on the Simulator. The look is checked there
// (W1, W2); what keeps them fixed is read from the source here, like axLayout.test.ts.
declare const __dirname: string;
const { readFileSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');
const src = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');

describe('W1 · the re-check row keeps its "+1.5" at the largest text sizes', () => {
  const c = src('design-system/components/CardParts.tsx');
  const row = c.slice(c.indexOf('export function DeltaRow'), c.indexOf('export interface DeltaReveal'));

  it('wraps at accessibility sizes (6.5 → 8.0 /10 +1.5 is wider than the card there)', () => {
    expect(row).toMatch(/const \{ colors, isAccessibilitySize \} = useTheme\(\);/);
    expect(row).toMatch(/flexWrap: isAccessibilitySize \? 'wrap' : 'nowrap'/);
  });

  it('the pill is pushed right only when the row stays on one line', () => {
    expect(row).toMatch(/marginLeft: isAccessibilitySize \? 0 : 'auto'/);
    expect(row).not.toMatch(/\{ marginLeft: 'auto', marginBottom: 4 \}/);
  });
});

describe('W2 · the morning card folded after a check shows the outfit its score is for', () => {
  it('the photo comes from the latest check (the re-check), like the score and the scroll target', () => {
    const m = src('features/morning/MorningCard.tsx');
    const row = m.slice(m.indexOf('function CheckedRow'), m.indexOf('function StayingInRow'));
    expect(row).toMatch(/const shot = latest\.photoFile \|\| latest\.demoPhotoId \? latest : first;/);
    expect(row).toMatch(/shownPhoto\(shot\.demoPhotoId, shot\.photoFile, undefined\)/);
    expect(row).not.toMatch(/shownPhoto\(first\./);
  });
});
