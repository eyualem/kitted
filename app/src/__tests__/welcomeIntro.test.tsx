// Welcome says what Kitted does (10-onboarding.md §14.7, #388): checks W1–W14, written before the build. W9, W12 and
// W15 are also checked on the Simulator (light, dark, the largest size, Reduce Motion).
import { scoreParts } from '@kitted/core';
import { evaluateCheck } from '@/features/fitcheck/scoring';
import { scoreWordLabel } from '@/design-system/score';
import { exampleCheck } from '@/features/onboarding/exampleCheck';
import { WELCOME_OUTFIT, welcomeExample } from '@/features/onboarding/welcomeExample';
import { lowerFirst, noteWelcomeShown, resetWelcomeShown, WELCOME_PLAN, WELCOME_PLAY_MS, welcomePlays } from '@/features/onboarding/welcomePlay';
import { en } from '@/i18n/en';

declare const __dirname: string;
const { readFileSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');
const src = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');

const WELCOME = src('features/onboarding/WelcomeScreen.tsx');
const HERO = src('features/onboarding/WelcomeHero.tsx');
const EXAMPLE_SCREEN = src('features/onboarding/ExampleCheckScreen.tsx');

describe('the example on Welcome', () => {
  test('W2: Welcome and the example check use no photo (nothing stock, no face)', () => {
    for (const file of [WELCOME, HERO, EXAMPLE_SCREEN]) {
      expect(file).not.toMatch(/demoPhoto|NeckDownPhoto|PhotoBubble|WELCOME_PHOTO/);
    }
  });

  test("W3: the card's score, word, summary and fix are the engine's, and the example check matches", () => {
    const ev = evaluateCheck({ reading: WELCOME_OUTFIT, occasion: 'everyday', styles: [], boldness: null, closet: [], firstCheck: true });
    const ex = welcomeExample()!;
    expect(ex.score).toBe(ev.row.score);
    expect(ex.word).toBe(scoreWordLabel(ex.score));
    expect(ex.summary).toBe(ev.row.explanation);
    expect(ex.fixes[0].copy).toBe(ev.row.fixes[0].copy);
    expect(ex.fixes[0].to).toBe(ev.row.fixes[0].to);
    expect(ex.fixes[0].to).toBeGreaterThan(ex.score);
    expect(ex.pieces).toHaveLength((WELCOME_OUTFIT.garments ?? []).length);
    expect(exampleCheck()!.score).toBe(ex.score);
    expect(exampleCheck()!.pieces).toBe(ex.pieces);
  });

  test('W3: today that is 6.5 Getting there, and the runner swap to 7.5', () => {
    const ex = welcomeExample()!;
    expect([ex.score, ex.word, ex.fixes[0].copy, ex.fixes[0].to]).toEqual([6.5, 'Getting there', 'Swap the running shoes for low-profile sneakers', 7.5]);
  });

  test('W4: the example is a full check (the card says Full)', () => {
    const scored = scoreParts(WELCOME_OUTFIT, { occasion: 'everyday', styles: [], boldness: 'a_little' }) as unknown as { partial: boolean };
    expect(scored.partial).toBe(false);
    expect(WELCOME_OUTFIT.scene?.shoes_visible).toBe(true);
  });
});

describe('the play', () => {
  beforeEach(() => resetWelcomeShown());

  test('W5: it plays on the first showing in a launch, and rests after that', () => {
    expect(welcomePlays({ reduceMotion: false, voiceOver: false })).toBe(true);
    noteWelcomeShown();
    expect(welcomePlays({ reduceMotion: false, voiceOver: false })).toBe(false);
  });

  test('W6, W7: never under Reduce Motion or VoiceOver', () => {
    expect(welcomePlays({ reduceMotion: true, voiceOver: false })).toBe(false);
    expect(welcomePlays({ reduceMotion: false, voiceOver: true })).toBe(false);
  });

  test('the beats run in order and finish inside the play (about 3 s)', () => {
    const P = WELCOME_PLAN;
    const order = [P.chip, P.card, P.tape, P.lock, P.word, P.fix, P.closet];
    for (let i = 1; i < order.length; i++) expect(order[i].at).toBeGreaterThanOrEqual(order[i - 1].at);
    for (const s of order) expect(s.at + s.ms).toBeLessThanOrEqual(WELCOME_PLAY_MS);
    expect(WELCOME_PLAY_MS).toBeLessThanOrEqual(3500);
    expect(P.tape.at + P.tape.ms).toBe(P.lock.at);
  });

  test('W8: a tap on the hero skips to the end; Get started is a plain button from the first frame', () => {
    expect(WELCOME).toMatch(/onTouchEnd=\{play\.skip\}/);
    expect(HERO).toMatch(/time\.set\(REVEAL_END\)/);
    // The buttons sit outside every timeline (never faded in).
    const bottom = WELCOME.slice(WELCOME.indexOf('styles.bottom'));
    expect(bottom).not.toMatch(/RevealStepView/);
  });
});

describe('VoiceOver, words, layout', () => {
  test('W7: the card is read once, as one line', () => {
    const ex = welcomeExample()!;
    const label = en['onb.welcome.a11y']
      .replace('{score}', '6.5').replace('{word}', ex.word).replace('{fix}', lowerFirst(ex.fixes[0].copy)).replace('{to}', '7.5').replace('{n}', '3');
    expect(label).toBe('Example fit check. 6.5 out of 10, Getting there. One fix: swap the running shoes for low-profile sneakers, for 7.5. Added 3 pieces to your closet.');
    expect(HERO).toMatch(/accessible accessibilityLabel=\{welcomeCardLabel\(ex\)\}/);
    expect(HERO).toMatch(/accessibilityElementsHidden/);
  });

  test('W11: the approved words', () => {
    expect(en['onb.welcome.title']).toBe('Send a fit pic.\nGet a score and\nthe one fix.');
    expect(en['onb.welcome.body']).toBe('It rates the outfit, never you, and learns your closet as you go. Your daily check is free.');
    expect(en['onb.welcome.chip']).toBe('Your fit');
    expect(en['onb.welcome.added']).toBe('Added {n} to your closet');
    expect(en['onb.example.intro']).toBe("Here's an example check. This is what you'll get.");
    expect(en['onb.example.note']).toBe('An example outfit, scored by the same code as yours. Nothing was sent.');
  });

  test('W11: no emoji, "unlimited", "AI stylist" or "accurate"', () => {
    const keys = Object.keys(en).filter((k) => k.startsWith('onb.welcome') || k.startsWith('onb.example'));
    for (const k of keys) {
      const v = (en as Record<string, string>)[k];
      expect(v).not.toMatch(/\p{Extended_Pictographic}/u);
      expect(v.toLowerCase()).not.toMatch(/unlimited|ai stylist|accurate|pocket stylist/);
    }
  });

  test('W1, W10: Get started goes straight to Looks (no new screen, still 8 taps) and saves the step', () => {
    expect(WELCOME).toMatch(/store\.setKv\(ONBOARDING_STEP_KEY, "looks"\)/);
    expect(WELCOME).toMatch(/router\.push\("\/onboarding\/looks"\)/);
  });

  test('W12: no forced status bar (there is no light photo now)', () => {
    expect(WELCOME).not.toMatch(/setStatusBarStyle/);
  });

  test('W13: the sign-in link keeps its place under the two buttons', () => {
    const iStart = WELCOME.indexOf('onb.welcome.start');
    const iExample = WELCOME.indexOf('onb.welcome.example');
    const iAccount = WELCOME.indexOf('onb.welcome.haveAccount');
    expect(iStart).toBeGreaterThan(0);
    expect(iExample).toBeGreaterThan(iStart);
    expect(iAccount).toBeGreaterThan(iExample);
  });

  test('W9: at the largest sizes the card stands alone (no drawing under it)', () => {
    expect(WELCOME).toMatch(/EXAMPLE && !isAccessibilitySize/);
    expect(WELCOME).toMatch(/EXAMPLE && isAccessibilitySize/);
  });

  test('W14: the example check draws the outfit where his photo would be', () => {
    expect(EXAMPLE_SCREEN).toMatch(/<WelcomeOutfit pieces=\{ex\.pieces\}/);
  });
});
