// 07 §20 (#320): two older layouts at the largest text size. The look is checked on the Simulator (A1–A4, B1–B2);
// what keeps them fixed is read from the source here (A5, B3).
declare const __dirname: string;
const { readFileSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');
const src = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');

describe('A · the composer field grows with its text', () => {
  const c = src('features/stylist/Composer.tsx');
  const field = c.slice(c.indexOf('key="field"'), c.indexOf('{trailButton}'));

  it('has no numberOfLines (on iOS it caps the measured height)', () => {
    expect(field).toMatch(/multiline/);
    expect(field).not.toMatch(/numberOfLines=/);
  });

  it('its max height scales with text size, capped at the controls’ 2×', () => {
    expect(c).toMatch(/const inputMax = INPUT_PAD \* 2 \+ INPUT_MAX_TEXT \* Math\.min\(Math\.max\(fontScale, 1\), CONTROL_TEXT_MAX_SCALE\);/);
    expect(field).toMatch(/maxHeight: inputMax/);
    expect(c).not.toMatch(/maxHeight: 120/);
  });
});

describe('B · the compact morning rows stack at accessibility sizes', () => {
  it('CollapsedShell puts the words under photo · score at accessibility sizes', () => {
    const m = src('features/morning/MorningCard.tsx');
    const shell = m.slice(m.indexOf('function CollapsedShell'));
    expect(shell).toMatch(/const stacked = isAccessibilitySize && Boolean\(left \|\| right \|\| chevron\);/);
    expect(shell).toMatch(/const content = stacked \?/);
  });
});
