// N8 (09-ui-review §15, #312): Numeral's `color` is a color value, never a token name. `color="accent"` was an
// invalid color on iOS (black), so the next best buy's "+16" vanished in dark mode. No string literal may be passed.
declare const __dirname: string;
const fs = jest.requireActual<{
  readFileSync(p: string, enc: 'utf8'): string;
  readdirSync(p: string, o: { withFileTypes: true }): { name: string; isDirectory(): boolean }[];
}>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');

function tsxFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : tsxFiles(p);
    return e.name.endsWith('.tsx') ? [p] : [];
  });
}

describe('N8 · Numeral colors', () => {
  it('no <Numeral> is given a string literal as its color', () => {
    const bad = tsxFiles(join(__dirname, '..')).flatMap((f) => {
      const src = fs.readFileSync(f, 'utf8');
      return [...src.matchAll(/<Numeral\b[^>]*?\bcolor="[^"]*"/g)].map((m) => `${f.split('/src/')[1]}: ${m[0]}`);
    });
    expect(bad).toEqual([]);
  });
});
