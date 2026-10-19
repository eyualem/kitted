// The Latest pill (02 G3, 07 §6.1; 09-ui-review §23 L1–L2, #353): checks written before the code. When it shows (pure)
// and how it's drawn and wired (from source).
import { AT_BOTTOM_PT, latestPillShows } from '@/features/stylist/latestShows';
import { t } from '@/i18n/en';

declare const __dirname: string;
const { readFileSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');
const src = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');

describe('L1 · when it shows', () => {
  const view = 700;
  const content = 5000;
  const offsetAt = (fromEnd: number) => content - view - fromEnd;

  it('hidden at the bottom (inside the 80 pt band), whatever arrived', () => {
    expect(AT_BOTTOM_PT).toBe(80);
    expect(latestPillShows({ contentH: content, viewH: view, offsetY: offsetAt(0), newBelow: false })).toBe(false);
    expect(latestPillShows({ contentH: content, viewH: view, offsetY: offsetAt(79), newBelow: true })).toBe(false);
  });

  it('scrolled up a little: only once something new arrived below', () => {
    expect(latestPillShows({ contentH: content, viewH: view, offsetY: offsetAt(300), newBelow: false })).toBe(false);
    expect(latestPillShows({ contentH: content, viewH: view, offsetY: offsetAt(300), newBelow: true })).toBe(true);
  });

  it('scrolled up more than one screen: always', () => {
    expect(latestPillShows({ contentH: content, viewH: view, offsetY: offsetAt(view + 1), newBelow: false })).toBe(true);
    expect(latestPillShows({ contentH: content, viewH: view, offsetY: 0, newBelow: false })).toBe(true);
  });

  it('a short thread or nothing measured yet: never', () => {
    expect(latestPillShows({ contentH: 500, viewH: view, offsetY: 0, newBelow: true })).toBe(false);
    expect(latestPillShows({ contentH: 0, viewH: 0, offsetY: 0, newBelow: true })).toBe(false);
  });
});

describe('L2 · the pill', () => {
  it('a 44 pt primary capsule, arrow.down and "Latest", a button for VoiceOver', () => {
    const pill = src('features/stylist/LatestPill.tsx');
    expect(pill).toMatch(/minHeight: 44/);
    expect(pill).toMatch(/colors\.primary/);
    expect(pill).toMatch(/["']arrow\.down["']/);
    expect(pill).toMatch(/t\('common\.latest'\)/);
    expect(pill).toMatch(/accessibilityRole="button"/);
    expect(t('common.latest')).toBe('Latest');
  });

  it('Stylist draws it above the dock and a toast, and a tap scrolls to the end and follows again', () => {
    const screen = src('features/stylist/StylistScreen.tsx');
    expect(screen).toMatch(/<LatestPill/);
    expect(screen).toMatch(/latestPillShows\(/);
    // The tap: back to following, then to the end.
    expect(screen).toMatch(/const toLatest = [\s\S]{0,300}follow\.set\(1\)[\s\S]{0,200}toEnd\(true\)/);
    // Its spot rides the keyboard, in a component mounted only while the pill shows, and it steps aside for a toast.
    // Amended after the Simulator (#353): an animated style kept with no view, reading the toast's room, left every
    // toast on Stylist invisible.
    expect(screen).toMatch(/function PillDock\([\s\S]{0,200}useAnimatedStyle\(\(\) => \(\{ bottom: base\.value \+ lift\.value \}\)\)/);
    expect(screen).toMatch(/\{pill && !toast \? <PillDock /);
    // The old always-on style is gone.
    expect(screen).not.toMatch(/pillStyle/);
  });

  it('the pill re-renders Stylist only when it turns on or off (a render per scroll or size change starved toasts)', () => {
    const screen = src('features/stylist/StylistScreen.tsx');
    expect(screen).toMatch(/if \(next === pillShown\.current\) return;/);
  });
});
