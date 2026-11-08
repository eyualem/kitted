/**
 * Test guards (#391): the shortcuts that make a test pass without checking
 * anything fail `npm run check`. Scans every test file in the app, core and
 * server suites. Paid live-AI tests (`*.manual.test.ts`) may skip themselves.
 */
declare const __dirname: string;
const { readdirSync, readFileSync, statSync } = jest.requireActual<{
  readdirSync(p: string): string[];
  readFileSync(p: string, enc: 'utf8'): string;
  statSync(p: string): { isDirectory(): boolean };
}>('fs');
const { join, relative, resolve } = jest.requireActual<{
  join(...p: string[]): string;
  relative(from: string, to: string): string;
  resolve(...p: string[]): string;
}>('path');

const ROOT = resolve(__dirname, '../../..');
const DIRS = ['app/src/__tests__', 'app/packages/kitted-core/test', 'firebase/tests'];
const SELF = 'testGuards.test.ts';

function testFiles(dir: string): string[] {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }
  return names.flatMap((name) => {
    if (name === 'node_modules' || name.startsWith('.')) return [];
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return testFiles(full);
    return /\.(test\.)?(ts|tsx|mjs|js)$/.test(name) && name !== SELF ? [full] : [];
  });
}

// Built from pieces so this file doesn't trip its own check. fit/xit only
// count at the start of a statement: "Check my fit (free and Pro)" is a name.
const dot = (a: string, b: string) => new RegExp(`\\b${a}\\.${b}\\s*\\(`);
const FOCUSED = [dot('(it|test|describe)', 'only'), /^\s*(fit|fdescribe|ftest)\s*\(/m];
const SKIPPED = [dot('(it|test|describe)', '(skip|todo)'), /^\s*(xit|xdescribe|xtest)\s*\(/m];
const SNAPSHOT = new RegExp(['toMatch', '(Inline)?', 'Snapshot'].join(''));

const files = DIRS.flatMap((d) => testFiles(join(ROOT, d)));

function offenders(patterns: RegExp[], allow: (file: string) => boolean = () => false) {
  return files
    .filter((f) => !allow(f))
    .filter((f) => patterns.some((p) => p.test(readFileSync(f, 'utf8'))))
    .map((f) => relative(ROOT, f));
}

describe('test guards', () => {
  it('finds the test suites', () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it('no focused tests (.only, fit, fdescribe)', () => {
    expect(offenders(FOCUSED)).toEqual([]);
  });

  it('no skipped or todo tests outside the paid manual tests', () => {
    expect(offenders(SKIPPED, (f) => f.endsWith('.manual.test.ts'))).toEqual([]);
  });

  it('no snapshot tests', () => {
    expect(offenders([SNAPSHOT])).toEqual([]);
  });
});
