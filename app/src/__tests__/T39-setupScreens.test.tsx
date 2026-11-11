// T39 · Setup as plain screens and the About you step, rendered (specs/onboarding-screens.md OS3–OS4, F1.1–F1.2,
// specs/you-and-first-run.md SY4.1–SY4.2; tasks/T39/TESTING.md). Welcome, Looks, About you (and Restore's "Welcome
// back"), the progress bar, the agreement's intro, and the old agreement link, on the memory store with the shared T39
// mocks (src/testing/t39ScreenMocks.tsx): nothing may be sent, and no bubble may be drawn on a setup screen.
//
// Profile (CLAUDE.md rule 6): no photo is used here. The age band is the one he taps (never estimated); the looks are
// the ones tapped in the test (or the stated drafts), the occasion everyday.
import {
  advance, allNodes, allTexts, byId, everyString, flat, flush, getId, idsInOrder, mockT39, mount, press, setUpT39Tests, T0, textAt, textOf, themeFor, typeIn, type Node,
} from '@/testing/t39ScreenMocks';
import { isHiddenFromAccessibility, screen, within } from '@testing-library/react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { StylistMessage, UserBubble } from '@/design-system';
import { getAgeBlocked, setAgeBlocked } from '@/data/secure';
import type { ProfileRow } from '@/data/types';
import OnboardingConsent from '@/app/onboarding/consent';
import { looksReply } from '@/features/onboarding/basics';
import { BasicsScreen } from '@/features/onboarding/BasicsScreen';
import { ConsentScreen } from '@/features/onboarding/ConsentScreen';
import { ExampleCheckScreen } from '@/features/onboarding/ExampleCheckScreen';
import { LOOKS, picksToStyles } from '@/features/onboarding/looks';
import { ONBOARDING_STEPS, OnboardingNav } from '@/features/onboarding/OnboardingNav';
import { PickLooksScreen } from '@/features/onboarding/PickLooksScreen';
import { WelcomeScreen } from '@/features/onboarding/WelcomeScreen';
import { styleLabel } from '@/features/morning/copy';
import { getGate } from '@/state/appGate';

const life = setUpT39Tests();

// ── The words (TESTING.md, exact) ─────────────────────────────────────────────────────────────────────────────────
const OLD_LOOKS_PROMPT = 'Which of these would you actually wear? Tap up to 3.';
const LOOKS_TITLE = 'Which of these would you actually wear?';
const LOOKS_LINE = 'Tap up to 3.';
const ABOUT_TITLE = 'About you';
const NAME_Q = 'What should Kit call you?';
const NAME_PLACEHOLDER = 'First name (optional)';
const AGE_Q = 'How old are you?';
const FOOTNOTE = 'Stays on your phone. It never changes your score.';
const HINT = 'Pick your age to go on.';
const RESTORE_TITLE = 'Welcome back';
const RESTORE_LINE = "Your age first, then I'll bring back your fits.";
const OLD_RESTORE = "Welcome back. Your birth year first, then I'll bring back your fits.";
const INTRO = "Before I score a photo, here's what happens to it.";
const ROWS = [
  { id: 'age-under18', label: 'Under 18', value: 'under18' },
  { id: 'age-18-21', label: '18–21', value: '18-21' },
  { id: 'age-22-25', label: '22–25', value: '22-25' },
  { id: 'age-26-30', label: '26–30', value: '26-30' },
  { id: 'age-31plus', label: '31 or older', value: '31+' },
] as const;

/** What About you (and Restore) no longer asks: height, build, the fit (its label and its three choices). */
const NOT_ASKED = /^(Height|Build|Fit you like|Fitted|Regular|Relaxed)$/;

const LOOKS_AX = [{ scheme: 'light' as const, ax: false }, { scheme: 'dark' as const, ax: false }, { scheme: 'light' as const, ax: true }, { scheme: 'dark' as const, ax: true }];

// ── helpers ───────────────────────────────────────────────────────────────────────────────────────────────────────
const isDisabled = (n: Node) => (n.props.accessibilityState as { disabled?: boolean } | undefined)?.disabled === true || n.props['aria-disabled'] === true;
const isSelected = (n: Node) => (n.props.accessibilityState as { selected?: boolean } | undefined)?.selected === true || n.props['aria-selected'] === true;
const continueBtn = () => within(getId('about-continue') as never).getByRole('button') as unknown as Node;
const rowLabel = (id: string, label: string) => getId(id).queryAll((x) => x.type === 'Text' && textOf(x) === label)[0]!;
const bubbles = () => [(StylistMessage as unknown as jest.Mock).mock.calls.length, (UserBubble as unknown as jest.Mock).mock.calls.length, screen.queryAllByTestId('mock-stylist-message').length, screen.queryAllByTestId('mock-user-bubble').length];
const pushes = () => (router.push as jest.Mock).mock.calls.map((c) => (typeof c[0] === 'string' ? c[0] : String((c[0] as { pathname?: string }).pathname)));
const replaces = () => (router.replace as jest.Mock).mock.calls.map((c) => (typeof c[0] === 'string' ? c[0] : String((c[0] as { pathname?: string }).pathname)));
const kvJson = async (k: string) => {
  const v = await mockT39.store.getKv(k);
  return v === null ? null : (JSON.parse(v) as unknown);
};
const profile = async () => (await mockT39.store.profile.get('me')) as ProfileRow | null;
const tile = (i: number) => screen.getAllByLabelText(new RegExp(`^${styleLabel(LOOKS[i]!.style)}`))[0]!;

/** About you's drafts: his looks from Looks, and an About you draft when given. */
async function drafts(o: { looks?: string[]; about?: { age: string | null; name: string } | string; basics?: object } = {}) {
  await mockT39.store.setKv('onboarding.looks', JSON.stringify(o.looks ?? ['smart_casual', 'workwear']));
  await mockT39.store.setKv('onboarding.step', 'basics');
  if (o.about !== undefined) await mockT39.store.setKv('onboarding.about', typeof o.about === 'string' ? o.about : JSON.stringify(o.about));
  if (o.basics) await mockT39.store.setKv('onboarding.basics', JSON.stringify(o.basics));
}

/** The forbidden setup-bubble words: Kit's mark, the old prompt, the echo, Kit's replies and the old restore line. */
function expectNoBubbleWords(o: { looksScreen?: boolean } = {}) {
  const texts = allTexts();
  expect(texts.filter((x) => x === 'Kit')).toEqual([]);
  expect(texts.filter((x) => x.includes(OLD_LOOKS_PROMPT))).toEqual([]);
  if (o.looksScreen) return;
  const replies = [looksReply([]), looksReply(['streetwear']), looksReply(['smart_casual', 'workwear'])];
  expect(texts.filter((x) => x === 'Streetwear' || x === 'Not sure yet' || /^Born in /.test(x) || replies.includes(x) || x === OLD_RESTORE)).toEqual([]);
}

// ── OS3.1 · no bubble on a setup screen ───────────────────────────────────────────────────────────────────────────
describe('OS3.1 · setup screens are plain', () => {
  it('OS3.1 · Looks, About you (on open and ready), Restore and Welcome render no bubble', async () => {
    for (const look of LOOKS_AX) {
      for (const accounts of [false, true]) {
        const tag = `${look.scheme}${look.ax ? ' AX' : ''}${accounts ? ' accounts' : ''}`;
        mockT39.theme = themeFor(look);
        mockT39.accounts = accounts;

        // Looks.
        jest.clearAllMocks();
        let r = await mount(<PickLooksScreen />);
        expect([tag, 'looks', bubbles()]).toEqual([tag, 'looks', [0, 0, 0, 0]]);
        expectNoBubbleWords({ looksScreen: true });
        expect(textAt('looks-title')).toBe(LOOKS_TITLE);
        await r.unmount();

        // About you on open (no drafts at all).
        jest.clearAllMocks();
        mockT39.params = {};
        r = await mount(<BasicsScreen />);
        expect([tag, 'about open', bubbles()]).toEqual([tag, 'about open', [0, 0, 0, 0]]);
        expectNoBubbleWords();
        expect(textAt('about-title')).toBe(ABOUT_TITLE);
        await r.unmount();

        // About you ready: looks ['streetwear'] and the draft { 22–25, Alex }.
        await drafts({ looks: ['streetwear'], about: { age: '22-25', name: 'Alex' } });
        jest.clearAllMocks();
        r = await mount(<BasicsScreen />);
        expect([tag, 'about ready', bubbles()]).toEqual([tag, 'about ready', [0, 0, 0, 0]]);
        expectNoBubbleWords();
        expect(isSelected(getId('age-22-25'))).toBe(true);
        await r.unmount();

        // Restore ("Welcome back").
        jest.clearAllMocks();
        mockT39.params = { restore: '214,38,61' };
        r = await mount(<BasicsScreen />);
        expect([tag, 'restore', bubbles()]).toEqual([tag, 'restore', [0, 0, 0, 0]]);
        expectNoBubbleWords();
        expect(textAt('about-title')).toBe(RESTORE_TITLE);
        expect(textAt('restore-line')).toBe(RESTORE_LINE);
        await r.unmount();
        mockT39.params = {};
        await mockT39.store.wipe();

        // Welcome.
        jest.clearAllMocks();
        r = await mount(<WelcomeScreen />);
        expect([tag, 'welcome', bubbles()]).toEqual([tag, 'welcome', [0, 0, 0, 0]]);
        expectNoBubbleWords();
        await r.unmount();
      }
    }
  });

  it("OS3.1 · the agreement's intro is plain text (camera and sheet)", async () => {
    for (const mode of ['camera', 'sheet'] as const) {
      jest.clearAllMocks();
      const r = await mount(<ConsentScreen mode={mode} />);
      expect([mode, bubbles()]).toEqual([mode, [0, 0, 0, 0]]);
      expect([mode, textAt('consent-intro')]).toEqual([mode, INTRO]);
      expect(allTexts().filter((x) => x === 'Kit')).toEqual([]);
      await r.unmount();
    }
  });
});

// ── OS3.2 · Welcome → Looks → About you → Stylist ─────────────────────────────────────────────────────────────────
describe('OS3.2 · three steps, no agreement', () => {
  it('OS3.2 · each step goes to the next and About you ends in Stylist', async () => {
    // Looks: one tile, Continue · 1 of 3.
    let r = await mount(<PickLooksScreen />);
    await press(tile(0));
    await press(screen.getByText('Continue · 1 of 3'));
    expect(await mockT39.store.getKv('onboarding.step')).toBe('basics');
    expect(router.push).toHaveBeenCalledWith('/onboarding/basics');
    await r.unmount();

    // Looks: Not sure.
    await mockT39.store.wipe();
    jest.clearAllMocks();
    r = await mount(<PickLooksScreen />);
    await press(screen.getByText('Not sure'));
    expect(await mockT39.store.getKv('onboarding.step')).toBe('basics');
    expect(router.push).toHaveBeenCalledWith('/onboarding/basics');
    await r.unmount();

    // About you: 22–25, Continue → onboarded, to "/" (Stylist), never the agreement or the camera.
    jest.clearAllMocks();
    r = await mount(<BasicsScreen />);
    await press(getId('age-22-25'));
    await press(continueBtn());
    await advance(5000);
    expect(await mockT39.store.getKv('onboarding.done')).toBe('1');
    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith('/');
    expect(pushes().filter((p) => p === '/onboarding/consent' || p.startsWith('/camera'))).toEqual([]);
    expect(pushes()).toEqual([]);
    await r.unmount();
  });

  it('OS3.2 · the bar has 3 segments', async () => {
    const { colors } = themeFor();
    expect(ONBOARDING_STEPS).toBe(3);

    let r = await mount(<OnboardingNav step={2} onBack={jest.fn()} />);
    expect(['onb-progress-seg-0', 'onb-progress-seg-1', 'onb-progress-seg-2'].map((id) => flat(getId(id)).backgroundColor)).toEqual([colors.ink, colors.ink, colors.line]);
    expect(byId('onb-progress-seg-3')).toBeNull();
    expect(getId('onb-progress').props.accessibilityLabel).toBe('Step 2 of 3');
    await r.unmount();

    r = await mount(<OnboardingNav step={3} onBack={jest.fn()} />);
    expect(['onb-progress-seg-0', 'onb-progress-seg-1', 'onb-progress-seg-2'].map((id) => flat(getId(id)).backgroundColor)).toEqual([colors.ink, colors.ink, colors.ink]);
    expect(byId('onb-progress-seg-3')).toBeNull();
    expect(getId('onb-progress').props.accessibilityLabel).toBe('Step 3 of 3');
    expect(everyString().filter((x) => /of 4/.test(x))).toEqual([]);
    await r.unmount();

    r = await mount(<OnboardingNav step={undefined} onBack={jest.fn()} />);
    expect(byId('onb-progress')).toBeNull();
    await r.unmount();

    // About you shows step 3 of 3; Restore shows no bar.
    r = await mount(<BasicsScreen />);
    expect(getId('onb-progress').props.accessibilityLabel).toBe('Step 3 of 3');
    await r.unmount();
    mockT39.params = { restore: '214,38,61' };
    r = await mount(<BasicsScreen />);
    expect(byId('onb-progress')).toBeNull();
    await r.unmount();
  });

  it('OS3.2 · the old agreement link opens About you', async () => {
    await mount(<OnboardingConsent />);
    expect(getId('redirect').props.href).toBe('/onboarding/basics');
    expect(byId('consent-intro')).toBeNull();
    expect(allTexts().filter((x) => x === 'Before your first fit check')).toEqual([]);
  });
});

// ── OS3.3 · Looks ─────────────────────────────────────────────────────────────────────────────────────────────────
describe('OS3.3 · Looks has a title and a line', () => {
  it('OS3.3 · the title and the line', async () => {
    for (const look of LOOKS_AX) {
      mockT39.theme = themeFor(look);
      const r = await mount(<PickLooksScreen />);
      const title = getId('looks-title');
      expect(textOf(title)).toBe(LOOKS_TITLE);
      expect(title.props.accessibilityRole).toBe('header');
      expect(textAt('looks-line')).toBe(LOOKS_LINE);
      // Directly after the title, in reading order.
      const texts = allNodes().filter((n) => n.type === 'Text' && typeof n.props.testID === 'string').map((n) => n.props.testID as string);
      expect(texts.indexOf('looks-line')).toBe(texts.indexOf('looks-title') + 1);
      expect(allTexts().filter((x) => x.includes(OLD_LOOKS_PROMPT))).toEqual([]);
      await r.unmount();
    }
  });

  it('OS3.3 · the tiles, Something else?, Not sure and Continue behave as before', async () => {
    let r = await mount(<PickLooksScreen />);
    // Nothing picked, no words: Continue is off.
    const cont = () => screen.getByRole('button', { name: /^Continue/ }) as unknown as Node;
    expect(isDisabled(cont())).toBe(true);
    expect(screen.queryByText('Pick by name instead')).toBeNull();
    expect(bubbles()).toEqual([0, 0, 0, 0]);

    await press(tile(0));
    await press(tile(1));
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Continue · 2 of 3')).toBeTruthy();
    await press(tile(2));
    expect(screen.getByText('Continue · 3 of 3')).toBeTruthy();
    // A 4th: the warning buzz once, "Up to 3.", picks unchanged.
    await press(tile(3));
    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('warning');
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(3);
    expect(screen.getByText('Up to 3.')).toBeTruthy();
    expect(screen.getByText('Continue · 3 of 3')).toBeTruthy();
    await press(screen.getByText('Continue · 3 of 3'));
    expect(await kvJson('onboarding.looks')).toEqual([LOOKS[0]!.style, LOOKS[1]!.style, LOOKS[2]!.style]);
    await r.unmount();

    // Something else? opens the field.
    await mockT39.store.wipe();
    r = await mount(<PickLooksScreen />);
    await press(screen.getByLabelText('Something else. Describe your style in your own words.'));
    expect(screen.getByPlaceholderText('Like skater, or all black')).toBeTruthy();
    await r.unmount();

    // Not sure saves no looks and goes on.
    await mockT39.store.wipe();
    jest.clearAllMocks();
    r = await mount(<PickLooksScreen />);
    await press(screen.getByText('Not sure'));
    expect(await kvJson('onboarding.looks')).toEqual([]);
    expect(router.push).toHaveBeenCalledWith('/onboarding/basics');
    expect(router.push).toHaveBeenCalledTimes(1);
    await r.unmount();
  });
});

// ── OS4.1 · About you on open ─────────────────────────────────────────────────────────────────────────────────────
describe('OS4.1 · About you', () => {
  it('OS4.1 · on open: the words in order, nothing picked, Continue off with the hint', async () => {
    for (const look of LOOKS_AX) {
      mockT39.theme = themeFor(look);
      const r = await mount(<BasicsScreen />);
      const order = idsInOrder();
      const want = ['about-title', 'about-name-label', 'about-name-input', 'about-age-label', 'about-age-list', ...ROWS.map((x) => x.id), 'about-footnote', 'about-hint', 'about-continue'];
      const at = want.map((id) => order.indexOf(id));
      expect([look, at.every((i) => i >= 0), at.every((i, k) => k === 0 || i > at[k - 1]!)]).toEqual([look, true, true]);

      const title = getId('about-title');
      expect([textOf(title), title.props.accessibilityRole]).toEqual([ABOUT_TITLE, 'header']);
      expect(textAt('about-name-label')).toBe(NAME_Q);
      expect(isHiddenFromAccessibility(getId('about-name-label') as never)).toBe(true);
      const input = getId('about-name-input');
      expect([input.props.placeholder, input.props.accessibilityLabel, input.props.value ?? '']).toEqual([NAME_PLACEHOLDER, NAME_Q, '']);
      const ageQ = getId('about-age-label');
      expect([textOf(ageQ), ageQ.props.accessibilityRole, isHiddenFromAccessibility(ageQ as never)]).toEqual([AGE_Q, 'header', false]);
      const list = getId('about-age-list');
      expect([list.props.accessibilityRole, list.props.accessibilityLabel]).toEqual(['radiogroup', AGE_Q]);
      for (const row of ROWS) {
        const n = getId(row.id);
        expect([row.id, n.props.accessibilityRole, n.props.accessibilityLabel, isSelected(n), byId(`${row.id}-check`), textOf(n)])
          .toEqual([row.id, 'radio', row.label, false, null, row.label]);
        expect([row.id, rowLabel(row.id, row.label).props.weight]).toEqual([row.id, '400']);
      }
      expect(textAt('about-footnote')).toBe(FOOTNOTE);
      expect(textAt('about-hint')).toBe(HINT);
      expect(isHiddenFromAccessibility(getId('about-hint') as never)).toBe(true);
      const btn = continueBtn();
      expect([textOf(btn), isDisabled(btn), btn.props.accessibilityHint]).toEqual(['Continue', true, HINT]);
      // Not present on About you.
      expect(everyString().filter((x) => /Birth year|^Choose$|Kitted is for 18 and up|Pick your birth year to go on/.test(x))).toEqual([]);
      // Only the name and the age are asked: no height, build or fit (BY1's promise, retired into this test).
      expect(everyString().filter((x) => NOT_ASKED.test(x))).toEqual([]);
      await r.unmount();
    }
  });

  it('OS4.1 · one tap picks, another moves the pick', async () => {
    await drafts();
    await mount(<BasicsScreen />);
    await press(getId('age-22-25'));
    expect(ROWS.map((x) => isSelected(getId(x.id)))).toEqual([false, false, true, false, false]);
    expect(byId('age-22-25-check')).not.toBeNull();
    expect(ROWS.filter((x) => byId(`${x.id}-check`)).map((x) => x.id)).toEqual(['age-22-25']);
    expect(rowLabel('age-22-25', '22–25').props.weight).toBe('600');
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(byId('about-hint')).toBeNull();
    expect([isDisabled(continueBtn()), continueBtn().props.accessibilityHint]).toEqual([false, undefined]);
    expect(await kvJson('onboarding.about')).toEqual({ age: '22-25', name: '' });
    // Nothing saved to the profile before Continue.
    expect(await profile()).toBeNull();

    await press(getId('age-26-30'));
    expect(ROWS.map((x) => isSelected(getId(x.id)))).toEqual([false, false, false, true, false]);
    expect(byId('age-22-25-check')).toBeNull();
    expect(byId('age-26-30-check')).not.toBeNull();
    expect(rowLabel('age-22-25', '22–25').props.weight).toBe('400');
    expect(await kvJson('onboarding.about')).toEqual({ age: '26-30', name: '' });
    expect(await profile()).toBeNull();
  });

  it('OS4.1 · the rows are equal until one is picked', async () => {
    await mount(<BasicsScreen />);
    const styles = ROWS.map((x) => flat(getId(x.id)));
    for (const s of styles) expect(s).toEqual(styles[0]);
    await press(getId('age-18-21'));
    const others = ROWS.filter((x) => x.id !== 'age-18-21').map((x) => flat(getId(x.id)));
    for (const s of others) expect(s).toEqual(others[0]);
    expect(ROWS.filter((x) => x.id !== 'age-18-21').map((x) => rowLabel(x.id, x.label).props.weight)).toEqual(['400', '400', '400', '400']);
  });

  it('OS4.1 · his name and pick come back after a close', async () => {
    await drafts({ about: { age: '22-25', name: 'Alex' } });
    let r = await mount(<BasicsScreen />);
    expect(getId('about-name-input').props.value).toBe('Alex');
    expect(ROWS.map((x) => isSelected(getId(x.id)))).toEqual([false, false, true, false, false]);
    expect(isDisabled(continueBtn())).toBe(false);
    await r.unmount();

    // An older draft with a birth year and no About you draft: nothing picked.
    await mockT39.store.wipe();
    await drafts({ basics: { birthYear: 2004 } });
    r = await mount(<BasicsScreen />);
    expect(ROWS.map((x) => isSelected(getId(x.id)))).toEqual([false, false, false, false, false]);
    expect(isDisabled(continueBtn())).toBe(true);
    await r.unmount();

    // A damaged draft: an empty one.
    await mockT39.store.wipe();
    await drafts({ about: '{not json' });
    r = await mount(<BasicsScreen />);
    expect(ROWS.map((x) => isSelected(getId(x.id)))).toEqual([false, false, false, false, false]);
    expect(getId('about-name-input').props.value ?? '').toBe('');
    await r.unmount();

    // Typed, closed, reopened, Continue: still saved trimmed (OS4.2's edge).
    await mockT39.store.wipe();
    await drafts();
    r = await mount(<BasicsScreen />);
    await typeIn(getId('about-name-input'), '  Alex ');
    await press(getId('age-22-25'));
    await r.unmount();
    r = await mount(<BasicsScreen />);
    expect(getId('about-name-input').props.value).toBe('  Alex ');
    await press(continueBtn());
    expect((await profile())?.name).toBe('Alex');
    await r.unmount();
  });
});

// ── OS4.2 · the name is optional, trimmed and cut ─────────────────────────────────────────────────────────────────
describe('OS4.2 · the name', () => {
  it('OS4.2 · a blank name goes on; a name is saved trimmed and cut', async () => {
    const cases: { typed: string | null; name: string | null }[] = [
      { typed: null, name: null },
      { typed: '  Alex ', name: 'Alex' },
      { typed: '   ', name: null },
      { typed: 'C'.repeat(40), name: 'C'.repeat(30) },
    ];
    for (const c of cases) {
      await mockT39.store.wipe();
      await drafts();
      jest.clearAllMocks();
      const r = await mount(<BasicsScreen />);
      expect(getId('about-name-input').props.maxLength).toBe(30);
      if (c.typed !== null) await typeIn(getId('about-name-input'), c.typed);
      await press(getId('age-22-25'));
      expect([c.typed, isDisabled(continueBtn())]).toEqual([c.typed, false]);
      await press(continueBtn());
      const p = await profile();
      expect([c.typed, p?.name, p?.ageBand]).toEqual([c.typed, c.name, '22-25']);
      expect(router.replace).toHaveBeenCalledWith('/');
      await r.unmount();
    }
  });
});

// ── OS4.3 · Continue lands in Stylist ─────────────────────────────────────────────────────────────────────────────
describe('OS4.3 · About you saves the band and lands in Stylist', () => {
  it('OS4.3 · Continue lands in Stylist', async () => {
    await drafts({ basics: { fit: 'relaxed', birthYear: 2004 } });
    const events: string[] = [];
    const s = mockT39.store;
    const setKv = s.setKv.bind(s);
    s.setKv = async (k: string, v: string) => {
      if (k === 'onboarding.done') events.push(`done:${(await s.profile.get('me')) ? 'profile' : 'no profile'}`);
      return setKv(k, v);
    };
    (router.replace as jest.Mock).mockImplementation((h: unknown) => events.push(`replace:${String(h)}`));
    await mount(<BasicsScreen />);
    await typeIn(getId('about-name-input'), 'Alex');
    await press(getId('age-22-25'));
    expect(await profile()).toBeNull();
    await press(continueBtn());
    await advance(5000);
    expect(events).toEqual(['done:profile', 'replace:/']);
    const p = (await profile())!;
    expect({ ageBand: p.ageBand, ageBandAt: p.ageBandAt, birthYear: p.birthYear, consentVersion: p.consentVersion, name: p.name, styles: p.styles, fitPreference: p.fitPreference })
      .toEqual({ ageBand: '22-25', ageBandAt: T0, birthYear: null, consentVersion: null, name: 'Alex', styles: picksToStyles(['smart_casual', 'workwear']), fitPreference: 'relaxed' });
    expect(pushes()).toEqual([]);
  });

  it('OS4.3 · a failed write leaves him on About you with Continue working again', async () => {
    await drafts();
    const s = mockT39.store;
    const put = s.profile.put.bind(s.profile);
    const err = jest.spyOn(console, 'error').mockImplementation(() => {});
    s.profile.put = jest.fn(() => Promise.reject(new Error('disk full'))) as never;
    await mount(<BasicsScreen />);
    await press(getId('age-22-25'));
    await press(continueBtn());
    await advance(1000);
    expect(router.replace).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
    expect(await s.getKv('onboarding.done')).toBeNull();
    expect(textAt('about-title')).toBe(ABOUT_TITLE);
    expect(isDisabled(continueBtn())).toBe(false);
    // The write works again: the same Continue goes through.
    s.profile.put = put;
    await press(continueBtn());
    await advance(1000);
    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith('/');
    expect((await profile())?.ageBand).toBe('22-25');
    err.mockRestore();
  });
});

// ── OS4.4 · Under 18 ──────────────────────────────────────────────────────────────────────────────────────────────
describe('OS4.4 · Under 18', () => {
  type Button = { text: string; style: string; onPress?: () => void };
  const alertButtons = () => (life.alert.mock.calls.at(-1)![2] as Button[]);

  it('OS4.4 · Under 18 asks once with the new title', async () => {
    await drafts();
    await mount(<BasicsScreen />);
    await press(getId('age-under18'));
    await press(continueBtn());
    expect(life.alert).toHaveBeenCalledTimes(1);
    const [title, message, buttons] = life.alert.mock.calls[0]! as [string, string, Button[]];
    expect([title, message]).toEqual(['Under 18?', 'Kitted is for ages 18 and up.']);
    expect(buttons.map((b) => ({ text: b.text, style: b.style }))).toEqual([{ text: 'Change', style: 'cancel' }, { text: "That's right", style: 'destructive' }]);
    expect(typeof buttons[1]!.onPress).toBe('function');
    // One alert per tap.
    await press(continueBtn());
    expect(life.alert).toHaveBeenCalledTimes(2);
    expect(everyString().filter((x) => /^Born in /.test(x))).toEqual([]);
  });

  it('OS4.4 · Change changes nothing', async () => {
    await drafts();
    await mount(<BasicsScreen />);
    await press(getId('age-under18'));
    await press(continueBtn());
    // The alert's buttons are taken before the mocks are cleared (clearing empties the Alert spy too).
    const change = alertButtons()[0]!;
    expect({ text: change.text, style: change.style }).toEqual({ text: 'Change', style: 'cancel' });
    jest.clearAllMocks();
    change.onPress?.();
    await flush();
    expect(setAgeBlocked).not.toHaveBeenCalled();
    expect(await getAgeBlocked()).toBe(false);
    expect(await profile()).toBeNull();
    expect([router.push, router.replace, router.back].map((f) => (f as jest.Mock).mock.calls.length)).toEqual([0, 0, 0]);
    expect(isSelected(getId('age-under18'))).toBe(true);
    expect(await kvJson('onboarding.about')).toEqual({ age: 'under18', name: '' });
  });

  it("OS4.4 · That's right locks the app", async () => {
    await drafts();
    await mount(<BasicsScreen />);
    await press(getId('age-under18'));
    await press(continueBtn());
    alertButtons()[1]!.onPress!();
    await flush();
    await advance(5000);
    expect(await getAgeBlocked()).toBe(true);
    expect(getGate().ageBlocked).toBe(true);
    expect(router.replace).toHaveBeenCalledWith('/');
    expect(await profile()).toBeNull();
    expect(await mockT39.store.chat.all()).toEqual([]);
    expect(pushes().filter((p) => p.startsWith('/camera'))).toEqual([]);
    expect(replaces().filter((p) => p.startsWith('/camera'))).toEqual([]);
  });
});

// ── OS4.5 · no "18" before the pick ───────────────────────────────────────────────────────────────────────────────
describe('OS4.5 · the only 18s before a pick', () => {
  it('OS4.5 · the only 18s before the pick are two choices', async () => {
    const with18 = () => everyString().filter((x) => x.includes('18'));
    for (const ax of [false, true]) {
      mockT39.theme = themeFor({ ax });
      for (const accounts of [false, true]) {
        mockT39.accounts = accounts;
        const r = await mount(<WelcomeScreen />);
        await advance(3000);
        expect([ax, accounts, 'welcome', with18()]).toEqual([ax, accounts, 'welcome', []]);
        await r.unmount();
      }
      for (const mode of ['screen', 'sheet'] as const) {
        const r = await mount(<ExampleCheckScreen mode={mode} />);
        expect([ax, mode, with18()]).toEqual([ax, mode, []]);
        await r.unmount();
      }
      let r = await mount(<PickLooksScreen />);
      expect([ax, 'looks', with18()]).toEqual([ax, 'looks', []]);
      await r.unmount();

      await mockT39.store.wipe();
      r = await mount(<BasicsScreen />);
      expect([ax, 'about', with18().sort()]).toEqual([ax, 'about', ['18–21', '18–21', 'Under 18', 'Under 18']]);
      await typeIn(getId('about-name-input'), 'Alex');
      expect([ax, 'about typed', with18().sort()]).toEqual([ax, 'about typed', ['18–21', '18–21', 'Under 18', 'Under 18']]);
      expect(everyString().filter((x) => /18 and up|18\+|ages 18/.test(x))).toEqual([]);
      await r.unmount();
    }
  });
});

// ── F1.1 · nothing opens the camera ───────────────────────────────────────────────────────────────────────────────
describe('F1.1 · no camera, account or paywall in setup', () => {
  it('F1.1 · nothing opens the camera before Check my fit', async () => {
    for (const accounts of [false, true]) {
      await mockT39.store.wipe();
      jest.clearAllMocks();
      mockT39.accounts = accounts;
      let r = await mount(<WelcomeScreen />);
      await advance(5000);
      await press(screen.getByText('Get started'));
      await advance(5000);
      expect(pushes()).toEqual(['/onboarding/looks']);
      await r.unmount();

      r = await mount(<PickLooksScreen />);
      await press(screen.getByText('Not sure'));
      await advance(5000);
      await r.unmount();

      r = await mount(<BasicsScreen />);
      await press(getId('age-22-25'));
      await press(continueBtn());
      await advance(5000);
      await r.unmount();

      expect([accounts, pushes()]).toEqual([accounts, ['/onboarding/looks', '/onboarding/basics']]);
      expect([accounts, replaces()]).toEqual([accounts, ['/']]);
      expect([...pushes(), ...replaces()].filter((p) => /camera|paywall|sign-in|consent/.test(p))).toEqual([]);
    }
  });
});

// ── F1.2 · nothing picked, then the stop ──────────────────────────────────────────────────────────────────────────
describe('F1.2 · the age question', () => {
  it('F1.2 · nothing picked, then the stop', async () => {
    // An older draft's birth year doesn't preselect a band.
    await drafts({ basics: { birthYear: 2004 } });
    await mount(<BasicsScreen />);
    expect(ROWS.map((x) => isSelected(getId(x.id)))).toEqual([false, false, false, false, false]);
    await press(getId('age-under18'));
    await press(continueBtn());
    const buttons = life.alert.mock.calls[0]![2] as { text: string; onPress?: () => void }[];
    buttons.find((b) => b.text === "That's right")!.onPress!();
    await flush();
    await advance(5000);
    expect(await getAgeBlocked()).toBe(true);
    expect(router.replace).toHaveBeenCalledWith('/');
    expect([...pushes(), ...replaces()].filter((p) => p.startsWith('/camera'))).toEqual([]);
  });
});

// ── SY4.1 · the name comes first and is optional ──────────────────────────────────────────────────────────────────
describe('SY4.1 · the name field', () => {
  it('SY4.1 · the name comes first and is optional', async () => {
    await drafts();
    let r = await mount(<BasicsScreen />);
    const order = idsInOrder();
    expect(order.indexOf('about-name-label')).toBeGreaterThanOrEqual(0);
    expect(order.indexOf('about-name-label')).toBeLessThan(order.indexOf('about-name-input'));
    expect(order.indexOf('about-name-input')).toBeLessThan(order.indexOf('about-age-label'));
    const input = getId('about-name-input');
    expect({ textContentType: input.props.textContentType, autoComplete: input.props.autoComplete, autoCapitalize: input.props.autoCapitalize })
      .toEqual({ textContentType: 'givenName', autoComplete: 'given-name', autoCapitalize: 'words' });
    expect(everyString().filter((x) => /\bSkip\b/.test(x))).toEqual([]);
    await press(getId('age-18-21'));
    expect(isDisabled(continueBtn())).toBe(false);
    await r.unmount();

    // No name field on Restore.
    mockT39.params = { restore: '214,38,61' };
    r = await mount(<BasicsScreen />);
    expect(byId('about-name-input')).toBeNull();
    expect(byId('about-name-label')).toBeNull();
    expect(byId('about-age-list')).not.toBeNull();
    // The same age list as setup, and no height, build or fit (BY1's "one layout in both paths").
    expect(ROWS.map((x) => [x.id, getId(x.id).props.accessibilityRole, textOf(getId(x.id))])).toEqual(ROWS.map((x) => [x.id, 'radio', x.label]));
    expect(everyString().filter((x) => NOT_ASKED.test(x))).toEqual([]);
    await r.unmount();
  });
});
