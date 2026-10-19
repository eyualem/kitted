// The UI audit's fix-first batch (09-ui-review §22.7, #355): checks F1–F12, written before the code. Behaviour where it's
// pure or runs on the memory store; the wiring from source. F13 (npm run check, the Simulator) is run by hand.
import { US_EASTERN, type Garment } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { colorGroups, fitField } from '@/features/correct/fields';
import { createAutoCapture, type Phase } from '@/features/camera/autoCapture';
import { createFitCheckService, DEFAULT_TIMERS } from '@/features/fitcheck/service';
import { deleteLookPhotos } from '@/features/lookbook/deletePhoto';
import { loadLook } from '@/features/lookbook/lookPage';
import { isBeta, planShortName, planStatus } from '@/features/settings/plan';
import { t } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { demoImagePrep } from '@/services/imagePrep/demo';
import { createQuota, LIMITS } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { realScheduler } from '@/services/scheduler';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), navigate: jest.fn() } }));

declare const __dirname: string;
const { readFileSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');
const src = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');

const STYLES = seed.scenarios.firstRun.onboardingAnswers.styles as unknown as [string, number][];
const g = (o: Partial<Garment>): Garment => ({ category: 'top', subcategory: 'tee', color_family: 'navy', ...o }) as Garment;
const values = (groups: ReturnType<typeof colorGroups>) => groups.flatMap((x) => x.options.map((o) => String(o.value)));

// ---------------------------------------------------------------------------------------------------------------- F1–F3
describe('F1–F3 · Wrong color or fit: a color for every piece, no empty fit row for shoes', () => {
  it('F1 every top, layer, pants and shoe gets the piece page\'s colors in their four groups', () => {
    for (const piece of [g({}), g({ category: 'outerwear', subcategory: 'overshirt' }), g({ category: 'bottom', subcategory: 'chinos', color_family: 'khaki_beige' }), g({ category: 'footwear', subcategory: 'white_leather_sneaker', color_family: 'white' })]) {
      const groups = colorGroups(piece);
      expect(groups.map((x) => x.title)).toEqual([t('closet.edit.color.blues'), t('closet.edit.color.neutrals'), t('closet.edit.color.earth'), t('closet.edit.color.colors')]);
      expect(values(groups)).toContain(String(piece.color_family));
      expect(values(groups)).toContain('black');
    }
  });

  it('F1 denim washes only for jeans and a denim jacket (or when it was read as one)', () => {
    expect(values(colorGroups(g({ category: 'bottom', subcategory: 'jeans', color_family: 'denim_dark' })))).toEqual(expect.arrayContaining(['denim_light', 'denim_mid', 'denim_dark']));
    expect(values(colorGroups(g({ category: 'bottom', subcategory: 'chinos', color_family: 'khaki_beige' })))).not.toContain('denim_mid');
    expect(values(colorGroups(g({ category: 'bottom', subcategory: 'chinos', color_family: 'denim_mid' })))).toContain('denim_mid');
  });

  it('F1 accessories get no colors; Save writes color_family (the sheet\'s color group)', () => {
    expect(colorGroups(g({ category: 'accessory', subcategory: 'belt' }))).toEqual([]);
    const sheet = src('features/correct/CorrectSheet.tsx');
    expect(sheet).toMatch(/colorGroups\(g\)\.map\(\(c\) => \(\{ field: 'color_family' as const/);
    expect(sheet).toMatch(/onPress=\{\(\) => setDraft\(\{ index: i, field: grp\.field, value: o\.value \}\)\}/);
  });

  it('F2 shoes and shorts have no fit row; tops, layers and pants keep theirs', () => {
    expect(fitField(g({ category: 'footwear', subcategory: 'retro_runner' }))).toBeNull();
    expect(fitField(g({ category: 'bottom', subcategory: 'shorts' }))).toBeNull();
    expect(fitField(g({}))?.field).toBe('volume');
    expect(fitField(g({ category: 'outerwear', subcategory: 'bomber' }))?.field).toBe('volume');
    expect(fitField(g({ category: 'bottom', subcategory: 'jeans' }))?.field).toBe('leg_shape');
    // The row never opens to a title over nothing.
    expect(src('features/correct/CorrectSheet.tsx')).toMatch(/isOpen && \(groups\.some\(\(grp\) => grp\.options\.length > 0\) \|\| reason === 'item'\)/);
    expect(src('features/correct/CorrectSheet.tsx')).not.toMatch(/nqr\.ask\.fit/);
  });

  it('F3 from the card\'s "Not sure" line: only that row\'s values, no colors', () => {
    expect(src('features/correct/CorrectSheet.tsx')).toMatch(/if \(only\) return fitGroup;/);
  });
});

// ---------------------------------------------------------------------------------------------------------------- F4–F5
describe('F4–F5 · Delete photos on a re-checked look deletes them all', () => {
  async function env() {
    const store = createMemoryStore();
    const clock = manualClock(Date.parse('2026-10-22T07:42:00-04:00'));
    const source = createMockReadingSource({ latency: () => 0, scheduler: realScheduler });
    const quota = createQuota({ store, clock, isPro: () => true });
    const svc = createFitCheckService({
      store, source, prep: demoImagePrep, quota, clock, scheduler: realScheduler, ids: counterIds(),
      timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }),
    });
    await store.profile.put({
      id: 'me', birthYear: 2005, heightCm: 178, build: 'average', fitPreference: 'regular', styles: STYLES, boldness: null, budget: null,
      lastOccasion: 'everyday', consentVersion: '1', consentAt: clock.nowMs(), onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: clock.nowMs(),
    });
    return { store, svc };
  }
  const deps = (store: ReturnType<typeof createMemoryStore>) => ({ store, deleteKept: () => {}, deleteClosetFiles: () => 0 });

  it('F4 the look lists both photos; deleting them leaves no photo and no Before photo', async () => {
    const { store, svc } = await env();
    const { checkId } = (await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
    const re = (await svc.start({ mode: 'recheck', photoId: 'p01a', parentCheckId: checkId })) as { checkId: string };
    const look = (await loadLook(store, checkId, { zone: US_EASTERN }))!;
    expect(look.shownId).toBe(re.checkId);
    expect(look.photoIds).toEqual([checkId, re.checkId]);
    expect(look.before?.photo).toBeTruthy();
    expect(await deleteLookPhotos(deps(store), look.photoIds)).toBe(true);
    const after = (await loadLook(store, checkId, { zone: US_EASTERN }))!;
    expect(after.photo).toBeNull();
    expect(after.before?.photo ?? null).toBeNull();
    expect(after.photoIds).toEqual([]);
    expect(after.score).toBe(look.score);
  });

  it('F4 an older look whose re-check photo alone was deleted still offers its first photo', async () => {
    const { store, svc } = await env();
    const { checkId } = (await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
    const re = (await svc.start({ mode: 'recheck', photoId: 'p01a', parentCheckId: checkId })) as { checkId: string };
    await store.fitChecks.patch(re.checkId, { photoFile: null, thumbFile: null, demoPhotoId: null });
    expect((await loadLook(store, checkId, { zone: US_EASTERN }))!.photoIds).toEqual([checkId]);
  });

  it('F4–F5 the menu and confirm say photos for two; the Lookbook row draws the first check\'s photo (gone with it)', () => {
    expect([t('look.deletePhotos'), t('look.delete.titleN')]).toEqual(['Delete photos', 'Delete these photos?']);
    expect(src('features/lookbook/lookActions.ts')).toMatch(/deleteLookPhotos\(\{ store, deleteKept: deleteHeldPhoto, deleteClosetFiles \}, checkIds\)/);
    expect(src('app/(tabs)/lookbook/index.tsx')).toMatch(/const photo = shownPhoto\(check\.demoPhotoId, check\.photoFile, undefined\);/);
  });
});

// ---------------------------------------------------------------------------------------------------------------- F6–F7
describe('F6–F7 · the beta\'s limits read "Beta", billing words follow a purchase', () => {
  it('F6 no purchase, server tier Pro: "Beta" with the beta\'s limits', () => {
    expect(isBeta({ pro: true, purchased: false })).toBe(true);
    expect(planStatus({ kind: 'free' }, US_EASTERN, true)).toEqual({
      title: 'Beta', detail: `Up to ${LIMITS.proChecks} fit checks and ${LIMITS.proQuestions} questions a day during the beta`,
    });
    expect(planShortName({ kind: 'free' }, true)).toBe('Beta');
  });

  it('F7 a purchase stays Kitted Pro; free stays Free plan', () => {
    expect(isBeta({ pro: true, purchased: true })).toBe(false);
    expect(isBeta({ pro: false, purchased: false })).toBe(false);
    expect(planStatus({ kind: 'free' }, US_EASTERN).title).toBe(t('you.plan.free'));
    expect(planShortName({ kind: 'pro', period: null, renewsAtMs: null }, false)).toBe(t('you.plan.pro'));
  });

  it('F6 Privacy\'s Pro warning, Manage subscription and the delete body read the purchase', () => {
    const privacy = src('app/(tabs)/you/privacy.tsx');
    expect(privacy).toMatch(/const pro = plan\?\.purchased === true \|\| \(DEMO_ENABLED && demoPlan === 'pro'\);/);
    expect(privacy).not.toMatch(/plan\?\.pro\b/);
    expect(privacy).toMatch(/t\(pro \? 'acct\.delete\.bodyPro' : 'acct\.delete\.body'\)/);
    expect(src('app/(tabs)/you/plan.tsx')).toMatch(/planStatus\(plan, sessionClock\.offset, plan\.kind === 'free' && isBeta\(today\.snap\)\)/);
    expect(src('app/(tabs)/you/settings.tsx')).toMatch(/planShortName\(plan, plan\.kind === 'free' && isBeta\(snap\)\)/);
  });
});

// ---------------------------------------------------------------------------------------------------------------- F8
describe('F8 · "I did make the change" leaves the re-check card open', () => {
  it('F8 confirming opens the card for good before the row changes', () => {
    expect(src('features/stylist/cards/RecheckCard.tsx')).toMatch(/iDid: \(\) => \{\s*setOpened\(true\);\s*void fitCheck\.confirmFixes\(row\.id\);\s*\}/);
  });
});

// ---------------------------------------------------------------------------------------------------------------- F9
describe('F9 · a failed capture starts the 3-2-1 over and says so', () => {
  function auto() {
    const timers: (() => void)[] = [];
    const phases: Phase[] = [];
    let shots = 0;
    const a = createAutoCapture({
      setTimer: (fn) => (timers.push(fn), timers.length), clearTimer: () => {}, onPhase: (p) => phases.push(p), onCapture: () => void shots++,
    });
    const run = () => {
      while (timers.length) timers.shift()!();
    };
    return { a, run, phases, shots: () => shots };
  }

  it('F9 after done, reset lets Propped count again and Mirror\'s timer count instead of shooting', () => {
    const x = auto();
    x.a.feed(true);
    x.run();
    expect(x.a.phase.kind).toBe('done');
    expect(x.shots()).toBe(1);
    // Without the reset nothing more happens (the bug).
    x.a.feed(true);
    expect(x.a.phase.kind).toBe('done');
    x.a.reset();
    x.a.feed(true);
    x.run();
    expect(x.shots()).toBe(2);
    x.a.reset();
    x.a.startCount();
    expect(x.a.phase).toEqual({ kind: 'counting', n: 3 });
  });

  it('F9 the camera resets the count and shows the line on a failed shot', () => {
    const cam = src('features/camera/CameraScreen.tsx');
    expect(cam).toMatch(/\} catch \{\s*setWhiteout\(false\);\s*captureFailed\(\);\s*\}/);
    expect(cam).toMatch(/function captureFailed\(\) \{\s*busy\.current = false;\s*auto\.current\?\.reset\(\);\s*setFailed\(true\);/);
    expect(cam).toMatch(/failed \? \{ icon: null, text: t\('cam\.captureFailed'\) \}/);
    expect(t('cam.captureFailed')).toBe("Couldn't take the photo. Try again.");
  });
});

// ---------------------------------------------------------------------------------------------------------------- F10
describe('F10 · a piece waiting on "Is this your …?" asks it on its page', () => {
  it('F10 the question replaces "What it is"', () => {
    const page = src('features/closet/PiecePage.tsx');
    expect(page).toMatch(/isAwaitingAnswer\(item, owned\) \? \(await fitCheck\.closet\.openAsks\(\)\)\.find\(\(\{ ask \}\) => ask\.itemId === item\.id\)/);
    expect(page).toMatch(/<DuplicateQuestion\s+ask=\{question\.ask\} photo=\{item\} candidate=\{question\.candidate\}/);
    expect(page).toMatch(/answerWithUndo\(answerDeps, question\.checkId, question\.ask, a,/);
    expect(page).toMatch(/\{rows\.length > 0 && !awaiting \? \(/);
  });
});

// ---------------------------------------------------------------------------------------------------------------- F11
describe('F11 · Past chats are read-only', () => {
  it('F11 the quick tap, Try again, Retake and "Which one is you?" do nothing on a past day', () => {
    const card = src('features/stylist/cards/FitCheckCard.tsx');
    expect(card).toMatch(/<TapCard row=\{row\} readOnly=\{readOnly\} \/>/);
    expect(card).toMatch(/<FailureCard row=\{row\} readOnly=\{readOnly\} \/>/);
    expect(card).toMatch(/\{!readOnly && code !== 'unknownPhoto'/);
    expect(card).toMatch(/action=\{readOnly \? undefined : \{ title: t\('recheck\.samePhoto\.button'\), onPress: retake \}\}/);
    const tap = src('features/tap/TapCard.tsx');
    expect(tap).toMatch(/if \(!readOnly\) AccessibilityInfo\.announceForAccessibility/);
    expect(tap).toMatch(/if \(readOnly\) \{\s*return \(\s*<KCard accessibilityLabel=\{`\$\{question\} \$\{t\('tap\.pastUnanswered'\)\}`\}>/);
    expect(src('features/whichOne/WhichOneCard.tsx')).toMatch(/const open = q\?\.state === 'open' && !readOnly;/);
    expect(src('features/stylist/MessageView.tsx')).toMatch(/<WhichOneCard m=\{m\} readOnly=\{readOnly\} \/>/);
  });
});

// ---------------------------------------------------------------------------------------------------------------- F12
describe('F12 · Kit\'s ask-card question is in his bubble', () => {
  it('F12 the question and "No longer in your closet" are StylistMessage bubbles', () => {
    const view = src('features/ask/AskCardView.tsx');
    expect(view).toMatch(/<StylistMessage>\{card\.question\}<\/StylistMessage>/);
    expect(view).toMatch(/if \(!data\.label\) return <StylistMessage>\{t\('ask\.card\.gone'\)\}<\/StylistMessage>;/);
    expect(view).not.toMatch(/<KText role="chatText">\{card\.question\}<\/KText>/);
  });
});

// ---------------------------------------------------------------------------------------------------------------- F14–F20
describe('F14–F20 · item 5: the action rows show under the folded rating, never the fixes', () => {
  const card = src('features/stylist/cards/FitCheckCard.tsx');
  const pressEnd = card.indexOf('</Pressable>\n        {/* The rows he acts on');
  const foldStart = card.indexOf('<Expandable open={open}');
  const foldEnd = card.indexOf('</Expandable>');
  const between = card.slice(pressEnd, foldStart);
  const inside = card.slice(foldStart, foldEnd);

  it('F14–F17 Finish the check, the closet question, the Not sure line and Later sit between the rating and the fold', () => {
    expect(pressEnd).toBeGreaterThan(0);
    expect(between).toMatch(/<FinishRow row=\{row\} info=\{finish\} \/>/);
    expect(between).toMatch(/<DuplicateQuestion ask=\{firstAsk\}/);
    expect(between).toMatch(/<DoubtLine doubt=\{doubt\} \/>/);
    expect(between).toMatch(/title=\{t\('card\.later'\)\}/);
  });

  it('F18 the fixes, tips, closet line, Re-check and Why stay inside the fold; none of the four: nothing drawn', () => {
    for (const x of ['<FixRow', '<TipLine', '<ClosetSummaryRow', "t('card.recheck')", "t('card.why'"]) {
      expect(between).not.toContain(x);
      expect(inside).toContain(x);
    }
    expect(card).toMatch(/const hasActions = !!\(firstAsk && askPhoto && askCandidate\) \|\| !!finish \|\| !!doubt \|\| !!later;/);
    expect(between).toMatch(/\{hasActions \? \(/);
  });

  it('F19 each row is drawn once (not again inside the fold)', () => {
    for (const x of ['<FinishRow', '<DuplicateQuestion', '<DoubtLine', "t('card.later')"]) {
      expect(card.split(x).length - 1).toBe(x === "t('card.later')" ? 2 : 1); // Later: the row and its VoiceOver action
      expect(inside).not.toContain(x);
    }
  });

  it('F20 the rows come in with the summary; the fold still grows the thread', () => {
    expect(between).toMatch(/<RevealStepView t=\{rt\} step=\{plan\?\.summary\}>/);
    expect(card).toMatch(/<Expandable open=\{open\} grow=\{readOnly \? undefined : threadGrow\}>/);
  });
});
