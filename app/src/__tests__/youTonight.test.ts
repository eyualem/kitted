// The You tab's batch of 8 (Oct 22, #370), written before the code: YT1–YT9. Each names what he'll see.
import { US_EASTERN } from '@kitted/core';
import { createMemoryStore } from '@/data/memoryStore';
import type { FitCheckRow } from '@/data/types';
import { darkColors, lightColors, radius } from '@/design-system/tokens';
import { en, t } from '@/i18n/en';
import { manualClock, parseZonedIso } from '@/services/clock';
import { openRecheckId } from '@/services/quota';
import { blankProfile, draftOf, saveDraft } from '@/features/you/profile';
import { todayAction } from '@/features/you/today';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), navigate: jest.fn() } }));

const fs = jest.requireActual('fs') as { readFileSync(p: string, e: string): string; readdirSync(p: string): string[] };
const path = jest.requireActual('path') as { resolve(...p: string[]): string; join(...p: string[]): string };
const src = (p: string) => fs.readFileSync(path.resolve(p), 'utf8');
const YOU = 'src/app/(tabs)/you';
const at = (iso: string) => parseZonedIso(iso) ?? 0;

const check = (o: Partial<FitCheckRow> & { id: string }): FitCheckRow =>
  ({ createdAt: at('2026-10-22T19:00:00'), isFirstCheck: false, recheckUsed: false, status: 'scored', parentId: null, dayKey: '2026-10-22', ...o }) as FitCheckRow;

describe("YT1: Today's card can be acted on", () => {
  const snap = { checksUsed: 0, checkLimit: 1, recheckId: null };
  it('a check left: Check my fit (free and Pro)', () => {
    expect(todayAction(snap)).toEqual({ kind: 'check' });
    expect(todayAction({ ...snap, checksUsed: 3, checkLimit: 10 })).toEqual({ kind: 'check' });
  });
  it("today's check used, its re-check still open: Re-check that check", () => {
    expect(todayAction({ ...snap, checksUsed: 1, recheckId: 'R-7' })).toEqual({ kind: 'recheck', checkId: 'R-7' });
  });
  it('nothing left: no button (the card says next at 4 am)', () => {
    expect(todayAction({ ...snap, checksUsed: 1 })).toBeNull();
  });
  it('the open re-check is the newest one still open, never a used, unscored or re-check row', () => {
    const clock = manualClock(at('2026-10-22T19:10:00'), US_EASTERN);
    const rows = [
      check({ id: 'old', createdAt: at('2026-10-22T18:50:00') }),
      check({ id: 'new', createdAt: at('2026-10-22T19:05:00') }),
      check({ id: 'used', createdAt: at('2026-10-22T19:06:00'), recheckUsed: true }),
      check({ id: 'child', createdAt: at('2026-10-22T19:07:00'), parentId: 'new' }),
      check({ id: 'held', createdAt: at('2026-10-22T19:08:00'), status: 'held' }),
    ];
    expect(openRecheckId(rows, clock.nowMs(), clock)).toBe('new');
    clock.set(at('2026-10-22T20:00:00'));
    expect(openRecheckId(rows, clock.nowMs(), clock)).toBeNull();
  });
  it('the buttons use the words the app already has, and go where the card buttons go', () => {
    const you = src(`${YOU}/index.tsx`);
    expect(you).toContain("t('closet.empty.check')");
    expect(you).toContain("t('look.recheck')");
    expect(you).toContain("kind: 'checkMyFit'");
    expect(you).toContain("kind: 'recheck'");
    // Stylist opens the re-check camera for that check, as the card's own Re-check does.
    const stylist = src('src/features/stylist/StylistScreen.tsx');
    expect(stylist).toMatch(/action\.kind === 'recheck'[\s\S]{0,160}mode=recheck&parent=\$\{action\.checkId\}/);
  });
});

describe('YT2: Privacy & data is one tap from You', () => {
  it('a Privacy & data row on You itself, still in Settings too', () => {
    const you = src(`${YOU}/index.tsx`);
    expect(you).toContain("t('settings.privacy')");
    expect(you).toContain("'/you/privacy'");
    expect(src(`${YOU}/settings.tsx`)).toContain("'/you/privacy'");
  });
});

describe('YT3: no profile still has a way into the editor', () => {
  it('a blank profile has no looks, no basics, no birth year and no consent', () => {
    const p = blankProfile(5);
    expect([p.styles, p.heightCm, p.build, p.fitPreference, p.birthYear, p.consentVersion, p.consentAt]).toEqual([[], null, '', '', null, null, null]);
    expect(draftOf(p).picks).toEqual([]);
  });
  it('saving the editor with no stored profile creates one, without consent', async () => {
    const s = createMemoryStore();
    const wrote = await saveDraft(s, { ...draftOf(blankProfile(0)), picks: ['workwear'] }, 9);
    expect(wrote).toBe(true);
    const p = await s.profile.get('me');
    expect(p?.styles.map(([k]) => k)).toEqual(['workwear']);
    expect([p?.consentVersion, p?.birthYear]).toEqual([null, null]);
  });
  it('saving an untouched blank draft writes nothing', async () => {
    const s = createMemoryStore();
    expect(await saveDraft(s, draftOf(blankProfile(0)), 9)).toBe(false);
    expect(await s.profile.get('me')).toBeNull();
  });
  it('You shows the style card for no profile; the editor opens on a blank one', () => {
    expect(src(`${YOU}/index.tsx`)).not.toContain('{profile ? <StyleCard');
    expect(src(`${YOU}/profile.tsx`)).toContain('blankProfile(');
  });
});

describe('YT4: a 4th style tap answers, like onboarding', () => {
  it('a warning buzz, a shake, and the "That\'s 3" line read out', () => {
    const p = src(`${YOU}/profile.tsx`);
    expect(p).toContain('NotificationFeedbackType.Warning');
    expect(p).toMatch(/announceForAccessibility\?\.\(t\('profile\.stylesFull'\)\)/);
    expect(src('src/features/you/NumberedPill.tsx')).toContain('shake');
  });
});

describe('YT5: the editor says Done, since leaving already saves', () => {
  it('the header button is Done and always on', () => {
    const p = src(`${YOU}/profile.tsx`);
    expect(p).toContain("t('common.done')");
    expect(p).not.toContain("t('common.save')");
  });
});

describe('YT6: VoiceOver', () => {
  // "the birth-year row reads …" retired by T39 (#412–#413, OS4.6): the row is now Age, one VoiceOver element
  // ("Age, 22–25"; an older profile's band from its birth year, "Age, 18–21"), held by T39-styleProfile
  // "OS4.6 · Name, Fit you like, Age, and the footnote" and "OS4.6 · an older profile shows the band from its birth year".
  it('"Score my fits" says what turning it on or off does', () => {
    expect(src('src/features/settings/SettingsList.tsx')).toMatch(/accessibilityHint=\{hint\}/);
    const priv = src(`${YOU}/privacy.tsx`);
    expect(priv).toContain("t(consentOn ? 'privacy.a11y.consentOffHint' : 'privacy.a11y.consentOnHint')");
  });
});

describe('YT7: one red, one card corner', () => {
  const lum = (hex: string) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const ratio = (a: string, b: string) => {
    const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  };
  it('a danger color in both themes, 4.5:1 or more on a card', () => {
    expect(ratio(lightColors.danger, lightColors.surface)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(darkColors.danger, darkColors.surface)).toBeGreaterThanOrEqual(4.5);
  });
  it('no screen keeps its own red', () => {
    for (const f of [`${YOU}/privacy.tsx`, 'src/features/closet/PiecePage.tsx']) expect(src(f)).not.toMatch(/#C9302C|#FF6961/i);
  });
  it('You and every page under it use the small card corner, by token', () => {
    const files = [...fs.readdirSync(path.resolve(YOU)).map((f) => `${YOU}/${f}`), 'src/features/settings/SettingsList.tsx', 'src/features/you/FactRows.tsx'];
    for (const f of files) {
      const s = src(f);
      expect(s).not.toMatch(/radius=\{\d+\}/);
      const cards = s.match(/<KCard\b[^>]*>/g) ?? [];
      for (const c of cards) expect([f, c]).toEqual([f, expect.stringContaining('radius={radius.cardSmall}')]);
    }
    expect(radius.cardSmall).toBe(20);
  });
  it('the fact rows divide like Settings (inset)', () => {
    expect(src('src/features/you/FactRows.tsx')).toContain('<RowDivider inset={space.rowX} />');
  });
});

describe('YT8: one way to say when it resets', () => {
  it('"resets at 4 am" everywhere, never "resets 4 am"', () => {
    const bad = Object.entries(en).filter(([, v]) => /resets 4 am/i.test(String(v)));
    expect(bad).toEqual([]);
    expect(t('you.today.resets')).toBe('resets at 4 am');
    expect(t('limit.resets')).toBe('Resets at 4 am');
  });
});
