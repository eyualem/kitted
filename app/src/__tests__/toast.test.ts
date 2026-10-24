// G2: one toast at a time; a newer toast replaces the old, and hiding an old one is a no-op.
// The Undo countdown ring (09-ui-review §21, #324): checks U1–U9, written before the code. The timing is pure
// (toast.ts); the ring's wiring is checked from source.
import { DELETE_AFTER_MS } from '@/features/closet/fileCleanup';
import {
  TOAST_MS,
  TOAST_MS_REMOVAL,
  countdownHidesAt,
  countdownLeftMs,
  countdownSeconds,
  getToast,
  hideToast,
  holdCountdown,
  releaseCountdown,
  showToast,
  startCountdown,
  toastHardStopMs,
  toastWindowMs,
} from '@/features/toast/toast';
import { screenScenario } from '@/demo/scenarios';
import { t } from '@/i18n/en';

declare const __dirname: string;
const { readFileSync, readdirSync, statSync } = jest.requireActual<{
  readFileSync(p: string, enc: 'utf8'): string;
  readdirSync(p: string): string[];
  statSync(p: string): { isDirectory(): boolean };
}>('fs');
const { join, relative } = jest.requireActual<{ join(...p: string[]): string; relative(a: string, b: string): string }>('path');
const SRC = join(__dirname, '..');
const src = (p: string) => readFileSync(join(SRC, p), 'utf8');

describe('toast store', () => {
  it('shows one at a time; hiding a replaced toast leaves the new one', () => {
    const first = showToast('Logged for today.', () => {});
    expect(getToast()?.text).toBe('Logged for today.');
    const second = showToast('Correction saved.');
    hideToast(first);
    expect([getToast()?.text, getToast()?.undo]).toEqual(['Correction saved.', undefined]);
    hideToast(second);
    expect(getToast()).toBeNull();
  });

  it('stamps each toast with the wall clock it showed at', () => {
    const before = Date.now();
    const id = showToast('Logged for today.', () => {});
    expect(getToast()!.shownAt).toBeGreaterThanOrEqual(before);
    expect(getToast()!.shownAt).toBeLessThanOrEqual(Date.now());
    hideToast(id);
  });
});

describe('U2 · the ring is the real window', () => {
  it('starts at the window in whole seconds and hides when it reaches 0', () => {
    const c = startCountdown(1_000, TOAST_MS, toastHardStopMs({}));
    expect(countdownSeconds(countdownLeftMs(c, 1_000))).toBe(5);
    expect(countdownSeconds(countdownLeftMs(c, 1_001))).toBe(5);
    expect(countdownSeconds(countdownLeftMs(c, 2_000))).toBe(4);
    expect(countdownSeconds(countdownLeftMs(c, 5_999))).toBe(1);
    expect(countdownLeftMs(c, 6_000)).toBe(0);
    expect(countdownHidesAt(c)).toBe(6_000);
  });

  it('5 s and 8 s windows; VoiceOver doubles them (10 s, 16 s), as before (#36)', () => {
    expect(toastWindowMs({}, false)).toBe(5_000);
    expect(toastWindowMs({ ms: TOAST_MS_REMOVAL }, false)).toBe(8_000);
    expect(toastWindowMs({}, true)).toBe(10_000);
    expect(toastWindowMs({ ms: TOAST_MS_REMOVAL }, true)).toBe(16_000);
    expect(countdownSeconds(startCountdown(0, toastWindowMs({ ms: TOAST_MS_REMOVAL }, true), 16_000).windowMs)).toBe(16);
  });

  it('the host hides, numbers and draws from that one countdown', () => {
    const host = src('features/toast/ToastHost.tsx');
    expect(host).toMatch(/countdownHidesAt\(c\) <= now\)[\s\S]{0,40}hideToast\(toast\.id\)/);
    expect(host).toContain('progress.set(withTiming(0, { duration: left, easing: Easing.linear }))');
    expect(host).not.toMatch(/setTimeout\(\(\) => hideToast/); // no second, separate deadline
  });
});

describe('U3 · which Undo gets which window', () => {
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
      const p = join(dir, f);
      return statSync(p).isDirectory() ? (f === '__tests__' ? [] : files(p)) : /\.tsx?$/.test(f) ? [p] : [];
    });
  // Every call that passes an Undo, by file (or area) and message, and whether it removes or rewrites something (8 s).
  const EXPECTED: Record<string, boolean> = {
    'lookbook/ · lookbook.removed': true, // Remove from Lookbook (the tab or features/lookbook)
    'app/(tabs)/closet/index.tsx · toast: (text, undo)': false, // a "Same as your …?" answer (#323)
    'features/morning/MorningCard.tsx · toast.logged': false,
    'features/stylist/cards/OutfitIdeaCard.tsx · toast.logged': false,
    'features/ask/AskCardView.tsx · toast.logged': false,
    'features/closet/OutfitsView.tsx · toast.logged': false,
    'features/finish/StarterScreen.tsx · (text, undo);': false, // a pick on the list of what he owns (#343)
    'features/finish/StarterScreen.tsx · (text, undo, {': true, // Remove from closet on that list
    'features/you/facts.ts · toast.forgot': true,
    'features/closet/pieceActions.ts · closet.removed': true,
    'features/closet/pieceActions.ts · closet.piece.photoRemoved': true,
    'features/closet/pieceActions.ts · toast: (text, undo)': true, // merge, Not this piece, It's another piece
    'features/closet/pieceActions.ts · editToast': true, // a "What it is" change
    'features/morning/SwapSheet.tsx · swap.done': true, // Swap one rewrites the card, and the piece stays out of it (#377)
    'features/closet/PairQuestion.tsx · closet.pair.saidNo': false, // "No, two pieces" on the pair card, an answer (#380)
  };
  it('removals and rewrites keep 8 s; the rest are 5 s', () => {
    const seen: Record<string, boolean> = {};
    for (const f of files(SRC)) {
      const rel = relative(SRC, f);
      if (rel.startsWith('features/toast/') || rel.startsWith('app/demo/')) continue;
      for (const line of readFileSync(f, 'utf8').split('\n')) {
        if (!/showToast\(.*,\s*(\(\) =>|async \(|undo\b|toast\.undo)/.test(line)) continue;
        const key = Object.keys(EXPECTED).find((k) => rel.includes(k.split(' · ')[0]!) && line.includes(k.split(' · ')[1]!));
        expect([rel, line.trim(), key]).not.toContainEqual(undefined);
        seen[key!] = line.includes('TOAST_MS_REMOVAL');
      }
    }
    expect(seen).toEqual(EXPECTED);
  });
});

describe('U4 · holding pauses, up to a hard stop', () => {
  it('freezes while held and resumes with the same time left', () => {
    let c = startCountdown(0, 8_000, toastHardStopMs({ ms: 8_000 }));
    c = holdCountdown(c, 3_000);
    expect(countdownLeftMs(c, 3_000)).toBe(5_000);
    expect(countdownLeftMs(c, 7_000)).toBe(5_000);
    c = releaseCountdown(c, 7_000);
    expect(countdownLeftMs(c, 7_000)).toBe(5_000);
    expect(countdownHidesAt(c)).toBe(12_000);
    expect(holdCountdown(holdCountdown(c, 8_000), 9_000).heldAt).toBe(8_000); // a second touch-down doesn't move it
  });

  it('a hold never keeps it past max(10 s, 2 × window)', () => {
    let c = startCountdown(0, 8_000, toastHardStopMs({ ms: 8_000 }));
    c = holdCountdown(c, 1_000);
    expect(countdownHidesAt(c)).toBe(16_000);
    expect(countdownLeftMs(c, 15_000)).toBe(1_000); // the ring follows the stop near the end
    c = releaseCountdown(c, 15_500);
    expect(countdownHidesAt(c)).toBe(16_000);
    expect(toastHardStopMs({})).toBe(10_000);
  });

  it("a removal's pictures are deleted only after the hard stop, with 4 s to spare", () => {
    expect(toastHardStopMs({ ms: TOAST_MS_REMOVAL }) + 4_000).toBeLessThanOrEqual(DELETE_AFTER_MS);
  });

  it('touch-down on the toast and on Undo both hold; Undo still undoes', () => {
    const host = src('features/toast/ToastHost.tsx');
    expect(host.match(/onPressIn=\{hold\}/g)).toHaveLength(2);
    expect(host.match(/onPressOut=\{release\}/g)).toHaveLength(2);
    expect(host).toMatch(/onPress=\{\(\) => \{\s*hideToast\(toast\.id\);\s*void toast\.undo\?\.\(\);/);
  });
});

describe('U5 · background and foreground', () => {
  it('runs on wall-clock time: past the deadline it is gone, within it the ring is where it belongs', () => {
    const c = startCountdown(10_000, 5_000, 10_000);
    expect(countdownHidesAt(c) <= 16_000).toBe(true); // back after 6 s: hidden at once
    expect(countdownLeftMs(c, 12_500)).toBe(2_500); // back after 2.5 s: half the ring
  });

  it('the host re-syncs on every app state change and ends a hold when the app leaves the screen', () => {
    const host = src('features/toast/ToastHost.tsx');
    expect(host).toContain("AppState.addEventListener('change'");
    expect(host).toMatch(/state !== 'active' && cd\.current\.heldAt !== null\) cd\.current = releaseCountdown/);
    expect(host).toContain('Date.now()');
    expect(src('features/toast/toast.ts')).toContain('shownAt: Date.now()');
  });
});

describe('U6 · Reduce Motion steps the ring with the number', () => {
  it('sets the arc to whole seconds and starts no animation', () => {
    const host = src('features/toast/ToastHost.tsx');
    expect(host).toMatch(/if \(reduceMotion\) progress\.set\(Math\.min\(1, \(secs \* 1000\) \/ c\.windowMs\)\);\s*else if/);
  });
});

describe('U7 · VoiceOver hears the time once', () => {
  it('announces the message with Undo and the seconds', () => {
    expect(t('toast.undoFor', { text: 'Removed your grey hoodie.', n: 16 })).toBe('Removed your grey hoodie. Undo, for 16 seconds.');
  });

  it('the ring and number are hidden from it; the button stays "Undo"; the announcement runs once per toast', () => {
    const host = src('features/toast/ToastHost.tsx');
    const ring = host.slice(host.indexOf('function UndoRing'));
    expect(ring).toContain('accessibilityElementsHidden');
    expect(ring).toContain('importantForAccessibility="no-hide-descendants"');
    expect(host).toContain("accessibilityLabel={t('common.undo')}");
    expect(host.match(/announceForAccessibility/g)).toHaveLength(1);
    expect(host).toMatch(/announceForAccessibility\?\.\(label\);[\s\S]{0,120}\}, \[toast, first\]\);/);
  });
});

describe('U1 + U8 · the ring: ink on line, grows with the text up to 2×', () => {
  it('draws only for an Undo, in ink on a line track, with tabular seconds capped at 2×', () => {
    const host = src('features/toast/ToastHost.tsx');
    expect(host).toMatch(/\{toast\.undo \? \([\s\S]*<UndoRing/);
    const ring = host.slice(host.indexOf('function UndoRing'));
    expect(ring).toContain('stroke={colors.line}');
    expect(ring).toContain('stroke={colors.ink}');
    expect(ring).not.toContain('accent');
    expect(ring).toContain('Math.min(Math.max(fontScale, 1), CONTROL_TEXT_MAX_SCALE)');
    expect(ring).toMatch(/tabular maxFontSizeMultiplier=\{CONTROL_TEXT_MAX_SCALE\}/);
    expect(host).toMatch(/flexShrink: 0, flexDirection: 'row'/); // ring + Undo stay on one line; the message wraps
    expect(host).toContain('const stacked = isAccessibilitySize && !!toast.undo;'); // and under it at accessibility sizes
  });
});

describe('U9 · demo screens', () => {
  it('204 holds a removal toast mid-way over Closet; 205 counts a 5 s one live', () => {
    expect(screenScenario(204)).toMatchObject({ href: '/closet', toast: { text: 'removed', removal: true } });
    expect(screenScenario(204)!.toast!.heldAtMs).toBeLessThan(TOAST_MS_REMOVAL);
    expect(screenScenario(205)).toMatchObject({ href: '/closet', toast: { text: 'logged' } });
    expect(screenScenario(205)!.toast!.heldAtMs).toBeUndefined();
  });
});
