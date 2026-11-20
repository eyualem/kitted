// T39 · Kit's first-check offer, rendered (specs/onboarding-screens.md OS5, F1.1, F1.3; tasks/T39/TESTING.md): the card
// and its buttons, the card switch in the thread, the agreement on top of the camera (app/camera.tsx with no demo
// screen), Later, Not now, a scored check, and the walk from Looks to the camera that must send nothing before Agree.
// The shared T39 mocks (src/testing/t39ScreenMocks.tsx) keep a failing fetch and a recording AI transport that must stay
// empty; the camera itself is a marker (no camera in Jest).
//
// Profile (CLAUDE.md rule 6): no photo is scored here. The held photo in F1.3 is a file path only (never read); the
// age band is the one tapped (22–25), the looks the stated drafts, the occasion everyday.
import {
  byId, flush, getId, mockT39, mount, press, setUpT39Tests, T0, textAt, textOf, typeIn,
} from '@/testing/t39ScreenMocks';
import { act, screen, within } from '@testing-library/react-native';
import { router } from 'expo-router';
import CameraRoute from '@/app/camera';
import { textMessage } from '@/data/seedLoader';
import type { ChatMessage, FitCheckRow, ProfileRow } from '@/data/types';
import { BasicsScreen } from '@/features/onboarding/BasicsScreen';
import { FirstCheckOfferCard } from '@/features/onboarding/FirstCheckOfferCard';
import { StyleGameScreen } from '@/features/onboarding/StyleGameScreen';
import { endStyleGame } from '@/features/onboarding/styleGameSession';
import { playStyleGame, pressId, seedRandom } from '@/testing/styleGameTestKit';
import { mayUpload } from '@/features/privacy/wipe';
import { ThreadRow } from '@/features/stylist/MessageView';
import { dropAfterConsent, resumeAfterConsent, startCheck } from '@/features/camera/startCheck';
import { discardTempPhoto } from '@/services/tempPhoto';

// The fit-check service and the photo files: F1.3 drives startCheck's held photo with a service that answers
// "noConsent"; the rest of this file never starts a check.
const mockFitCheck = { busy: jest.fn(() => false), start: jest.fn(), retry: jest.fn(), scoreHeldNow: jest.fn() };
jest.mock('@/features/fitcheck/session', () => ({
  get fitCheck() {
    return mockFitCheck;
  },
  useFitCheckSession: () => ({ kind: 'idle' }),
  quota: {},
  readingSource: {},
  setTimerOverride: jest.fn(),
  startHeldCatchUp: jest.fn(),
}));
jest.mock('@/services/tempPhoto', () => ({ discardTempPhoto: jest.fn() }));
// The thread's other cards draw Reanimated (no native runtime in Jest); they aren't under test here, so each is a marker.
jest.mock('@/features/stylist/cards/FitCheckCard', () => ({ FitCheckCard: () => null }));
jest.mock('@/features/stylist/cards/OutfitIdeaCard', () => ({ OutfitIdeaCard: () => null }));
jest.mock('@/features/stylist/cards/RecheckCard', () => ({ RecheckCard: () => null }));
jest.mock('@/features/morning/MorningCard', () => ({ MorningCard: () => null }));
jest.mock('@/features/whichOne/WhichOneCard', () => ({ WhichOneCard: () => null }));
jest.mock('@/features/ask/SupportCard', () => ({ SupportCard: () => null }));
jest.mock('@/features/ask/AskCardView', () => ({ AskAttachment: () => null }));
// The card's entrance wrapper (T104) pulls in Reanimated's native runtime: a plain pass-through here.
jest.mock('@/features/stylist/Enter', () => ({ Enter: ({ children }: { children: unknown }) => children, attachmentEnters: () => false }));
jest.mock('@/features/ask/AnswerBody', () => ({ AnswerBody: () => null, answerLayout: () => ({ chips: [] }), chipActions: () => [], useAnswerCloset: () => [] }));
jest.mock('@/features/held/HeldReadyCard', () => ({ HeldReadyCard: () => null }));
jest.mock('@/features/held/LimitCard', () => ({ LimitCard: () => null }));
jest.mock('@/features/account/AccountOfferCard', () => ({ AccountOfferCard: () => null }));
jest.mock('@/features/aboutYou/AboutYouCard', () => ({ AboutYouCard: () => null }));
jest.mock('@/features/finish/InviteCard', () => ({ InviteCard: () => null }));
jest.mock('@/features/finish/NotifyAskCard', () => ({ NotifyAskCard: () => null }));
jest.mock('@/features/stylist/ask', () => ({ retryQuestion: jest.fn() }));

jest.mock('@/features/toast/toast', () => ({ showToast: jest.fn() }));

const life = setUpT39Tests();

const TITLE = 'Want to check a fit now?';
const BODY = 'Stand back so your shoes are in the shot. Not dressed for it? Later works.';
const JOINED = `${TITLE} ${BODY}`;
const CHECK_LABEL = 'Check my fit. Opens the camera.';
const LATER_LINE = "No rush. Tap the camera button whenever you're ready.";
const TURN_ON = "Send me a fit. I'll score it and start your closet.";
const INTRO = "Please read this and agree before your first fit check. Nothing is sent until you do.";

// ── helpers ───────────────────────────────────────────────────────────────────────────────────────────────────────
const pushes = () => (router.push as jest.Mock).mock.calls.map((c) => (typeof c[0] === 'string' ? c[0] : String((c[0] as { pathname?: string }).pathname)));
const routerCalls = () => [router.push, router.replace, router.back, router.navigate, router.dismiss].reduce((n, f) => n + (f as jest.Mock).mock.calls.length, 0);
const chat = async () => [...(await mockT39.store.chat.all())].sort((a, b) => a.createdAt - b.createdAt);
const turnOns = async () => (await chat()).filter((m) => m.cardType === 'turnOnChecks');
const profile = async () => (await mockT39.store.profile.get('me')) as ProfileRow | null;

/** A store set up at the end of setup, written directly: his profile (no agreement), Kit's first message, the card. */
async function seedOffer(): Promise<ChatMessage> {
  await mockT39.store.profile.put({
    id: 'me', birthYear: null, heightCm: null, build: '', fitPreference: '', styles: [['smart_casual', 0.6], ['workwear', 0.4]] as never, boldness: null,
    budget: null, lastOccasion: 'everyday', consentVersion: null, consentAt: null, onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: T0,
    ageBand: '22-25', ageBandAt: T0, name: 'Alex',
  });
  await mockT39.store.chat.put(textMessage('M-100', T0, 'stylist', null, { aiNote: true }));
  const offer: ChatMessage = { ...textMessage('M-101', T0 + 1, 'stylist', null), kind: 'card', cardType: 'firstCheckOffer' };
  await mockT39.store.chat.put(offer);
  return offer;
}

function check(id: string, status: FitCheckRow['status']): FitCheckRow {
  return {
    id, createdAt: T0 + 60_000, dayKey: '2026-10-22', photoFile: null, thumbFile: null, demoPhotoId: 'p01b', imageHash: id, occasion: 'everyday', style: null,
    status, isPartial: false, notRated: [], score: status === 'scored' ? 7 : null, rawScore: status === 'scored' ? 7 : null, subscores: {}, occasionAdj: 0,
    rulesFired: [], credits: [], advice: [], fixes: [], explanation: null, rubricVersion: 'parts', isFavorite: false, snapState: 'none', recheckUsed: false,
    isFirstCheck: true, readingId: null, parentId: null, itemIds: [], details: {},
  } as FitCheckRow;
}

const buttonsIn = (id: string) => getId(id).queryAll((n) => typeof n.type === 'string' && n.props.accessibilityRole === 'button');
const write = async (f: () => Promise<unknown>) => {
  await act(async () => {
    await f();
  });
  await flush();
};

// ── OS5.1 · the card ──────────────────────────────────────────────────────────────────────────────────────────────
describe('OS5.1 · the offer card', () => {
  it("OS5.1 · the card's words, buttons and VoiceOver", async () => {
    const offer = await seedOffer();
    await mount(<FirstCheckOfferCard m={offer} />);
    expect(byId('offer-card')).not.toBeNull();
    expect(textAt('offer-title')).toBe(TITLE);
    expect(textAt('offer-body')).toBe(BODY);
    const joined = getId('offer-text');
    expect([joined.props.accessible, joined.props.accessibilityLabel, joined.props.accessibilityRole === 'header']).toEqual([true, JOINED, false]);
    // Title and body are inside the one element.
    expect(joined.queryAll((n) => n.props.testID === 'offer-title' || n.props.testID === 'offer-body').length).toBeGreaterThanOrEqual(2);
    const buttons = buttonsIn('offer-buttons');
    expect(buttons.map((b) => [textOf(b), b.props.accessibilityLabel])).toEqual([['Check my fit', CHECK_LABEL], ['Later', 'Later']]);
    // Nothing happens on its own: no camera, no route.
    expect(routerCalls()).toBe(0);
  });

  it('OS5.1 · the thread renders the card through the card switch', async () => {
    const offer = await seedOffer();
    await mount(<ThreadRow item={{ type: 'msg', key: offer.id, message: offer, showWho: false, answer: false, newest: true, gap: 0 }} />);
    expect(byId('offer-card')).not.toBeNull();
    expect(textAt('offer-title')).toBe(TITLE);
    expect(byId('offer-buttons')).not.toBeNull();
  });
});

// ── OS5.2 · Check my fit, the agreement, Not now ──────────────────────────────────────────────────────────────────
describe('OS5.2 · Check my fit', () => {
  it('OS5.2 · Check my fit opens the camera', async () => {
    const offer = await seedOffer();
    await mount(<FirstCheckOfferCard m={offer} />);
    await press(screen.getByLabelText(CHECK_LABEL));
    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith('/camera');
    expect(await profile().then((p) => p?.consentVersion)).toBeNull();
  });

  it('OS5.2 · the camera shows the agreement first, and Agree makes it live', async () => {
    await seedOffer();
    await mount(<CameraRoute />);
    expect(textAt('consent-intro')).toBe(INTRO);
    expect(screen.getByText('Privacy agreement')).toBeTruthy();
    expect(screen.getByText('Kitted privacy agreement')).toBeTruthy();
    // SY5.3: four numbered clauses and the line that says what tapping means, above the buttons.
    expect(['1', '2', '3', '4'].map((n) => screen.getAllByText(n).length > 0)).toEqual([true, true, true, true]);
    expect(textAt('consent-agree-line')).toBe('By tapping Agree and continue, you agree to this privacy agreement.');
    expect(screen.getByText('Agree and continue')).toBeTruthy();
    expect(screen.getByText('Not now')).toBeTruthy();
    expect(screen.getByLabelText('Close')).toBeTruthy();
    expect(byId('camera-screen')).toBeNull();
    await press(screen.getByText('Agree and continue'));
    const p = (await profile())!;
    expect([p.consentVersion, p.consentAt]).toEqual(['2', T0]);
    expect(byId('camera-screen')).not.toBeNull();
    expect(byId('consent-intro')).toBeNull();
  });

  it('OS5.2 · Not now and the X post Turn on fit checks once and the buttons go', async () => {
    for (const how of ['Not now', 'Close'] as const) {
      await mockT39.store.wipe();
      jest.clearAllMocks();
      const offer = await seedOffer();
      const r = await mount(
        <>
          <FirstCheckOfferCard m={offer} />
          <CameraRoute />
        </>,
      );
      expect([how, byId('offer-buttons') !== null]).toEqual([how, true]);
      await press(how === 'Close' ? screen.getByLabelText('Close') : screen.getByText('Not now'));
      const t1 = await turnOns();
      expect([how, t1.map((m) => ({ role: m.role, kind: m.kind, cardType: m.cardType, text: m.text }))]).toEqual([how, [{ role: 'stylist', kind: 'card', cardType: 'turnOnChecks', text: TURN_ON }]]);
      expect(t1[0]!.createdAt).toBeGreaterThan(offer.createdAt);
      expect(router.back).toHaveBeenCalledTimes(1);
      expect((await profile())?.consentVersion).toBeNull();
      expect([how, byId('offer-buttons')]).toEqual([how, null]);
      expect(textAt('offer-title')).toBe(TITLE);
      await r.unmount();
    }
    // The camera opened again (the accessory), Not now again: still one.
    const r2 = await mount(<CameraRoute />);
    await press(screen.getByText('Not now'));
    expect(await turnOns()).toHaveLength(1);
    await r2.unmount();
  });

  it('OS5.2 · agreed, then closed without a photo: the buttons stay and the camera opens live', async () => {
    const offer = await seedOffer();
    let r = await mount(
      <>
        <FirstCheckOfferCard m={offer} />
        <CameraRoute />
      </>,
    );
    await press(screen.getByText('Agree and continue'));
    expect(byId('camera-screen')).not.toBeNull();
    await r.unmount();
    r = await mount(<FirstCheckOfferCard m={offer} />);
    expect(buttonsIn('offer-buttons').map(textOf)).toEqual(['Check my fit', 'Later']);
    await r.unmount();
    await mount(<CameraRoute />);
    expect(byId('camera-screen')).not.toBeNull();
    expect(byId('consent-intro')).toBeNull();
    expect(await turnOns()).toEqual([]);
  });
});

// ── OS5.3 · Later ─────────────────────────────────────────────────────────────────────────────────────────────────
describe('OS5.3 · Later', () => {
  it("OS5.3 · Later: the buttons go and Kit's line follows", async () => {
    const offer = await seedOffer();
    let r = await mount(<FirstCheckOfferCard m={offer} />);
    await press(screen.getByText('Later'));
    expect(byId('offer-buttons')).toBeNull();
    expect(textAt('offer-title')).toBe(TITLE);
    expect(textAt('offer-body')).toBe(BODY);
    expect(routerCalls()).toBe(0);
    expect(await mockT39.store.getKv('firstCheckOffer.laterAt')).toBe(String(T0));
    const lines = (await chat()).filter((m) => m.text === LATER_LINE);
    expect(lines.map((m) => ({ role: m.role, kind: m.kind }))).toEqual([{ role: 'stylist', kind: 'text' }]);
    expect(lines[0]!.createdAt).toBeGreaterThan(offer.createdAt);
    await r.unmount();
    // Reopened (a relaunch): still no buttons.
    r = await mount(<FirstCheckOfferCard m={offer} />);
    expect(byId('offer-card')).not.toBeNull();
    expect(byId('offer-buttons')).toBeNull();
    await r.unmount();
  });
});

// ── OS5.4 · after a scored check ──────────────────────────────────────────────────────────────────────────────────
describe('OS5.4 · a scored check', () => {
  it('OS5.4 · a scored check removes the buttons for good', async () => {
    const offer = await seedOffer();
    let r = await mount(<FirstCheckOfferCard m={offer} />);
    expect(buttonsIn('offer-buttons').map(textOf)).toEqual(['Check my fit', 'Later']);
    // A failed and a held check don't.
    await write(() => mockT39.store.fitChecks.put(check('FC-1', 'failed')));
    await write(() => mockT39.store.fitChecks.put(check('FC-2', 'held')));
    expect(byId('offer-buttons')).not.toBeNull();
    // A scored one does, without a remount.
    await write(() => mockT39.store.fitChecks.put(check('FC-3', 'scored')));
    expect(byId('offer-buttons')).toBeNull();
    expect(textAt('offer-title')).toBe(TITLE);
    await r.unmount();
    r = await mount(<FirstCheckOfferCard m={offer} />);
    expect(byId('offer-card')).not.toBeNull();
    expect(byId('offer-buttons')).toBeNull();
    await r.unmount();

    // Read-only (Past chats): no buttons even when all is clear.
    await mockT39.store.wipe();
    const again = await seedOffer();
    r = await mount(<FirstCheckOfferCard m={again} readOnly />);
    expect(byId('offer-card')).not.toBeNull();
    expect(byId('offer-buttons')).toBeNull();
    await r.unmount();
    r = await mount(<FirstCheckOfferCard m={again} />);
    expect(byId('offer-buttons')).not.toBeNull();
    await r.unmount();
  });
});

// ── OS5.7 · nothing sent before Agree ─────────────────────────────────────────────────────────────────────────────
describe('OS5.7 · nothing leaves the phone before Agree', () => {
  // T113: Looks is the style game (specs/style-game.md). A fixed deal (seed 42, card 1 Workwear); Me on card 1, Not me
  // on the rest, so his one look is Workwear and there is no this-or-that.
  async function walkToCard(): Promise<ChatMessage> {
    endStyleGame();
    const random = jest.spyOn(Math, 'random').mockReturnValue(seedRandom(42)());
    let r = await mount(<StyleGameScreen />);
    expect(await playStyleGame({ me: 1 })).toBe(9); // the overlay's tap (SG1.4), then 8 cards
    expect(textAt('results-title')).toBe("Here's your style");
    await pressId('results-continue');
    await r.unmount();
    random.mockRestore();
    expect(await mockT39.store.getKv('onboarding.looks')).toBe('["workwear"]');
    r = await mount(<BasicsScreen />);
    await typeIn(getId('about-name-input'), 'Alex');
    await press(getId('age-22-25'));
    await press(within(getId('about-continue') as never).getByRole('button'));
    await r.unmount();
    const offer = (await chat()).find((m) => m.cardType === 'firstCheckOffer');
    expect(offer).toBeDefined();
    endStyleGame();
    return offer!;
  }

  // A walk through many renders: under the full suite's parallel load it has run past jest's 5 s (verify round 1, T3).
  it('OS5.7 · setup, the offer, Later, Check my fit and Not now send nothing', async () => {
    // Run 1: Later.
    let offer = await walkToCard();
    let r = await mount(<FirstCheckOfferCard m={offer} />);
    await press(screen.getByText('Later'));
    await r.unmount();
    expect(life.fetchMock).toHaveBeenCalledTimes(0);
    expect(mockT39.transport.send).toHaveBeenCalledTimes(0);
    expect(await mayUpload(mockT39.store)).toBe(false);

    // Run 2: Check my fit → the agreement in the camera → Not now.
    await mockT39.store.wipe();
    jest.clearAllMocks();
    offer = await walkToCard();
    // The walk's own route (Looks → About you, OS3.2) and nothing else: no camera before Check my fit.
    expect(pushes()).toEqual(['/onboarding/basics']);
    (router.push as jest.Mock).mockClear();
    r = await mount(<FirstCheckOfferCard m={offer} />);
    await press(screen.getByLabelText(CHECK_LABEL));
    expect(pushes()).toEqual(['/camera']);
    await r.unmount();
    r = await mount(<CameraRoute />);
    expect(textAt('consent-intro')).toBe(INTRO);
    await press(screen.getByText('Not now'));
    await r.unmount();
    expect(life.fetchMock).toHaveBeenCalledTimes(0);
    expect(mockT39.transport.send).toHaveBeenCalledTimes(0);
    expect(await mayUpload(mockT39.store)).toBe(false);
  }, 20000);
});

// ── F1.3 · a photo held for the agreement ─────────────────────────────────────────────────────────────────────────
describe('F1.3 · the held photo', () => {
  const PHOTO = { photoUri: 'file:///tmp/held-1.jpg' };
  const PHOTO2 = { photoUri: 'file:///tmp/held-2.jpg' };

  it('F1.3 · a photo held for the agreement is scored after Agree, dropped after Not now', async () => {
    // Agree: the same photo starts again, once.
    mockFitCheck.start.mockReset();
    mockFitCheck.start.mockResolvedValueOnce({ outcome: 'noConsent' }).mockResolvedValueOnce({ outcome: 'scored', checkId: 'FC-1' });
    await startCheck('check', PHOTO);
    expect(router.push).toHaveBeenCalledWith('/sheets/consent?resume=1');
    expect(mockFitCheck.start).toHaveBeenCalledTimes(1);
    expect(resumeAfterConsent()).toBe(true);
    await flush();
    expect(mockFitCheck.start).toHaveBeenCalledTimes(2);
    expect(mockFitCheck.start.mock.calls[1]![0]).toEqual(mockFitCheck.start.mock.calls[0]![0]);
    expect(mockFitCheck.start.mock.calls[0]![0]).toMatchObject({ mode: 'check', photoUri: PHOTO.photoUri });
    expect(discardTempPhoto).not.toHaveBeenCalled();
    expect(resumeAfterConsent()).toBe(false);
    expect(mockFitCheck.start).toHaveBeenCalledTimes(2);

    // Not now: the photo goes, and nothing waits any more.
    mockFitCheck.start.mockReset();
    (discardTempPhoto as jest.Mock).mockClear();
    mockFitCheck.start.mockResolvedValue({ outcome: 'noConsent' });
    await startCheck('check', PHOTO);
    dropAfterConsent();
    expect(discardTempPhoto).toHaveBeenCalledTimes(1);
    expect(discardTempPhoto).toHaveBeenCalledWith(PHOTO.photoUri);
    expect(resumeAfterConsent()).toBe(false);
    expect(mockFitCheck.start).toHaveBeenCalledTimes(1);

    // A second held photo replaces (and drops) the first; Agree starts only the second.
    mockFitCheck.start.mockReset();
    (discardTempPhoto as jest.Mock).mockClear();
    mockFitCheck.start.mockResolvedValueOnce({ outcome: 'noConsent' }).mockResolvedValueOnce({ outcome: 'noConsent' }).mockResolvedValueOnce({ outcome: 'scored', checkId: 'FC-2' });
    await startCheck('check', PHOTO);
    await startCheck('check', PHOTO2);
    expect((discardTempPhoto as jest.Mock).mock.calls).toEqual([[PHOTO.photoUri]]);
    expect(resumeAfterConsent()).toBe(true);
    await flush();
    expect(mockFitCheck.start).toHaveBeenCalledTimes(3);
    expect(mockFitCheck.start.mock.calls[2]![0]).toMatchObject({ photoUri: PHOTO2.photoUri });
    expect((discardTempPhoto as jest.Mock).mock.calls).toEqual([[PHOTO.photoUri]]);
  });
});

