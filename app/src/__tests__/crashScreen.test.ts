// A crash shows a screen, not a blank app, and leaves a trace (09-ui-review §23 E1–E4, #353): checks written before
// the code. The log line's shape and size, the global handler's chaining, and the wiring from source.
import { errorLine, installErrorHandler, keepTail, LOG_MAX_BYTES } from '@/services/errors/log';
import { t } from '@/i18n/en';

declare const __dirname: string;
const { readFileSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');
const src = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');

describe('E1 · the crash screen', () => {
  it('the root layout exports expo-router\'s ErrorBoundary, drawn by the crash screen', () => {
    const layout = src('app/_layout.tsx');
    expect(layout).toMatch(/export function ErrorBoundary\(/);
    expect(layout).toMatch(/<CrashScreen/);
  });

  it('the crash screen has its own theme, the words, Try again (retry) and Go to Kitted', () => {
    const screen = src('features/crash/CrashScreen.tsx');
    expect(screen).toMatch(/<ThemeProvider/);
    expect(screen).toMatch(/t\('crash\.title'\)/);
    expect(screen).toMatch(/t\('crash\.body'\)/);
    expect(screen).toMatch(/t\('crash\.retry'\)[\s\S]*retry\(\)/);
    expect(screen).toMatch(/t\('gone\.home'\)/);
    expect(screen).toMatch(/recordError\(error, 'render'\)/);
    expect(t('crash.title')).toBe('Something went wrong.');
    expect(t('crash.body')).toBe('Kitted hit a problem on this screen. Your fits and closet are safe on this phone.');
    expect(t('crash.retry')).toBe('Try again');
    expect(t('gone.home')).toBe('Go to Kitted');
  });
});

describe('E2 · one short line per error, a small file', () => {
  const at = Date.parse('2026-10-19T08:30:00Z');

  it('the time, where, the name and message, at most 5 stack lines', () => {
    const e = new TypeError('Cannot read property x of undefined');
    e.stack = ['TypeError: Cannot read property x of undefined', ...Array.from({ length: 9 }, (_, i) => `    at fn${i} (index.bundle:1:${i})`)].join('\n');
    const line = errorLine(e, 'render', at);
    expect(line.startsWith('2026-10-19T08:30:00.000Z render TypeError: Cannot read property x of undefined')).toBe(true);
    expect(line).toContain('fn0');
    expect(line).toContain('fn4');
    expect(line).not.toContain('fn5');
    expect(line.endsWith('\n')).toBe(true);
    // One line in the file: stack frames joined, never raw newlines inside it.
    expect(line.slice(0, -1).includes('\n')).toBe(false);
  });

  it('a long message is cut to 200 characters; a thrown string or object is handled', () => {
    const line = errorLine(new Error('x'.repeat(500)), 'js', at);
    const msg = line.split(' ').slice(3).join(' ');
    expect(msg.startsWith('x'.repeat(200))).toBe(true);
    expect(msg.includes('x'.repeat(201))).toBe(false);
    expect(errorLine('plain string', 'js', at)).toContain('Error: plain string');
    expect(errorLine({ weird: true }, 'fatal', at)).toContain('fatal Error:');
    expect(errorLine(undefined, 'js', at)).toContain('js Error:');
    // A dev build's frames are long bundle URLs: each is cut to 160 characters.
    const long = new Error('x');
    long.stack = `Error: x\n    at f (http://127.0.0.1:8082/${'q'.repeat(900)})`;
    expect(errorLine(long, 'js', at).length).toBeLessThan(260);
  });

  it('the file keeps its newest half once it passes ~100 KB, starting on a whole line', () => {
    expect(LOG_MAX_BYTES).toBe(100_000);
    const old = Array.from({ length: 2000 }, (_, i) => `line ${i} ${'y'.repeat(60)}\n`).join('');
    expect(old.length).toBeGreaterThan(LOG_MAX_BYTES);
    const kept = keepTail(old);
    expect(kept.length).toBeLessThanOrEqual(LOG_MAX_BYTES / 2);
    expect(kept.startsWith('line ')).toBe(true);
    expect(kept.endsWith('line 1999 ' + 'y'.repeat(60) + '\n')).toBe(true);
    expect(keepTail('short\n')).toBe('short\n');
  });

  it('written in every build (never behind __DEV__), to Documents/logs/errors.log', () => {
    const code = src('services/errors/log.ts');
    expect(code).toMatch(/'errors\.log'/);
    expect(code).toMatch(/Paths\.document, 'logs'/);
    expect(code).not.toMatch(/__DEV__/);
    expect(code).not.toMatch(/fetch\(/);
  });
});

describe('E3 · the global handler records, then hands on', () => {
  type Handler = (e: unknown, fatal?: boolean) => void;
  const g = globalThis as unknown as { ErrorUtils?: { getGlobalHandler(): Handler; setGlobalHandler(h: Handler): void } };
  let saved: typeof g.ErrorUtils;
  beforeEach(() => {
    saved = g.ErrorUtils;
  });
  afterEach(() => {
    g.ErrorUtils = saved;
  });

  it('records each uncaught error (fatal or not) and calls the handler that was there, once', () => {
    let current: Handler = jest.fn();
    const previous = current;
    g.ErrorUtils = { getGlobalHandler: () => current, setGlobalHandler: (h) => (current = h) };
    const record = jest.fn();
    installErrorHandler(record);
    installErrorHandler(record); // twice: still one wrap
    const e = new Error('boom');
    current(e, true);
    expect(record).toHaveBeenCalledTimes(1);
    expect(record).toHaveBeenCalledWith(e, 'fatal');
    expect(previous).toHaveBeenCalledTimes(1);
    expect(previous).toHaveBeenCalledWith(e, true);
    current(e, false);
    expect(record).toHaveBeenLastCalledWith(e, 'js');
  });

  it('a recorder that throws never stops the original handler', () => {
    let current: Handler = jest.fn();
    const previous = current;
    g.ErrorUtils = { getGlobalHandler: () => current, setGlobalHandler: (h) => (current = h) };
    installErrorHandler(() => {
      throw new Error('disk full');
    }, { fresh: true });
    current(new Error('boom'), true);
    expect(previous).toHaveBeenCalledTimes(1);
  });

  it('the root layout installs it once at start', () => {
    expect(src('app/_layout.tsx')).toMatch(/installErrorHandler\(\)/);
  });
});

describe('E4 · it goes with the data and comes off the phone', () => {
  it('"Delete all my data" removes Documents/logs (errors.log with it)', () => {
    expect(src('features/privacy/files.ts')).toMatch(/deleteLogs\(\) \{\s*remove\(dir\('document', 'logs'\)\)/);
  });
  it('tools/phone/pull.sh prints errors.log', () => {
    expect(readFileSync(join(__dirname, '..', '..', '..', 'tools', 'phone', 'pull.sh'), 'utf8')).toMatch(/errors\.log/);
  });
});
