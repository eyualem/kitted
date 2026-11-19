// T35 · Kit's hello (specs/setup-and-you.md SY2.1, SY2.9): setup's end posts it once, above the offer, as exactly
// `I'm Kit, your stylist.`, and an install from before this update reads its old AI-note message in the new words
// (the thread draws aiNote messages from the string, not from stored text). The shared T39 mocks keep the AI transport
// and fetch recording, and the thread's other cards are markers.
//
// Profile (CLAUDE.md rule 6): no photo is scored here; the stated draft is 22–25, smart casual + workwear.
import { flush, mockT39, mount, setUpT39Tests, T0 } from '@/testing/t39ScreenMocks';
import { screen } from '@testing-library/react-native';
import { textMessage } from '@/data/seedLoader';
import type { ChatMessage } from '@/data/types';
import { finishSetup, saveAbout } from '@/features/onboarding/aboutStep';
import { LOOKS_KEY } from '@/features/onboarding/basics';
import { ThreadRow } from '@/features/stylist/MessageView';
import { en, t } from '@/i18n/en';

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

setUpT39Tests();

const HELLO = "I'm Kit, your stylist.";
const row = (m: ChatMessage) => ({ type: 'msg' as const, key: m.id, message: m, showWho: true, answer: false, newest: false, gap: 0 });
const chat = async () => [...(await mockT39.store.chat.all())].sort((a, b) => a.createdAt - b.createdAt);
let n = 0;
const ids = (p: string) => `${p}-${++n}`;

describe("SY2.1 · Kit's hello at setup's end", () => {
  it("SY2.1 · About you's Continue posts the hello once, above Kit's offer, with no AI note", async () => {
    await mockT39.store.setKv(LOOKS_KEY, JSON.stringify(['smart_casual', 'workwear']));
    await saveAbout(mockT39.store, { age: '22-25', name: '' });
    await finishSetup(mockT39.store, T0, ids);
    const msgs = await chat();
    const hellos = msgs.filter((m) => m.payload.aiNote);
    expect(hellos).toHaveLength(1);
    expect(msgs[0]!.id).toBe(hellos[0]!.id);
    expect(msgs[1]!.cardType).toBe('firstCheckOffer');
    await mount(<ThreadRow item={row(hellos[0]!)} />);
    await flush();
    expect(screen.queryByText(HELLO)).not.toBeNull();
    expect(screen.queryByText(/an AI|never faces|Quick note/)).toBeNull();
  });

  it('SY2.1 · the hello is the exact words, and no Kit line in the strings lists features with bullets', () => {
    expect(t('stylist.aiNote')).toBe(HELLO);
    const kit = Object.entries(en).filter(([k]) => k.startsWith('stylist.') || k.startsWith('offer.') || k.startsWith('noConsent.'));
    for (const [, v] of kit) expect(v).not.toMatch(/(^|\n)\s*([-•*]|\d+\.)\s/);
  });
});

describe('SY2.9 · an install from before this update', () => {
  it("SY2.9 · its old AI-note message (stored with no text) reads Kit's new hello", async () => {
    // As an older install stored it: the aiNote flag and no text of its own.
    const old = textMessage('M-1', T0, 'stylist', null, { aiNote: true });
    await mockT39.store.chat.put(old);
    await mount(<ThreadRow item={row(old)} />);
    await flush();
    expect(screen.queryByText(HELLO)).not.toBeNull();
  });
});
