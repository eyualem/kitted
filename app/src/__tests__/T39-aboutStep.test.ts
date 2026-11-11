// T39 · About you, the end of setup and Kit's first-check offer: the pure and store-level half (specs/onboarding-screens.md
// OS3–OS5, specs/you-and-first-run.md SY4; tasks/T39/TESTING.md). Everything runs on the memory store (the phone's
// SQLite for the V9 migration), with no screen, no network and no AI.
//
// Profile (CLAUDE.md rule 6): no photo is used here. The age bands are his own pick on About you (never estimated);
// the looks draft is ['smart_casual', 'workwear'], the occasion everyday, as TESTING.md states.
import seed from '../../assets/seed.json';
import { US_EASTERN } from '@kitted/core';
import { createMemoryStore } from '@/data/memoryStore';
import { MIGRATIONS } from '@/data/migrations';
import { loadScenario, textMessage } from '@/data/seedLoader';
import type { KittedStore } from '@/data/store';
import type { AgeBand, ChatMessage, FitCheckRow, ProfileRow } from '@/data/types';
import { bandFromBirthYear, cleanName, finishSetup, NAME_MAX, profileAgeBand } from '@/features/onboarding/aboutStep';
import { completeOnboarding } from '@/features/onboarding/complete';
import { declineAgreement, loadOfferState, OFFER_LATER_KEY, offerButtonsShow, tapLater } from '@/features/onboarding/firstCheckOffer';
import { picksToStyles } from '@/features/onboarding/looks';
import { parseStep, resumeHref } from '@/features/onboarding/resume';
import { deleteAllData } from '@/features/privacy/wipe';
import { buildThreadItems, sortMessages } from '@/features/stylist/thread';
import { counterIds } from '@/services/ids';

const T0 = Date.parse('2026-10-22T07:41:00-04:00');
const T1 = T0 + 60_000;
const T2 = T0 + 120_000;
const LOOKS = ['smart_casual', 'workwear'] as const;
const LATER_LINE = "No rush. Tap the camera button whenever you're ready.";
const TURN_ON = "Send me a fit. I'll score it and start your closet.";
const DRAFT_KEYS = ['onboarding.looks', 'onboarding.basics', 'onboarding.about', 'onboarding.step', 'onboarding.otherStyle'] as const;

async function fresh(): Promise<KittedStore> {
  const store = createMemoryStore();
  await store.init();
  return store;
}

/** The drafts setup leaves in kv by About you's Continue: his looks, his own words, an older basics draft (a fit and a
 *  birth year from before this change), his About you pick and name, and the resume step. */
async function drafts(store: KittedStore, age: string | null, name: string) {
  await store.setKv('onboarding.looks', JSON.stringify(LOOKS));
  await store.setKv('onboarding.otherStyle', 'all black');
  await store.setKv('onboarding.basics', JSON.stringify({ fit: 'relaxed', birthYear: 2004 }));
  await store.setKv('onboarding.about', JSON.stringify({ age, name }));
  await store.setKv('onboarding.step', 'basics');
}

async function kvOf(store: KittedStore) {
  const out: Record<string, string | null> = {};
  for (const k of DRAFT_KEYS) out[k] = await store.getKv(k);
  out[OFFER_LATER_KEY] = await store.getKv(OFFER_LATER_KEY);
  out['onboarding.done'] = await store.getKv('onboarding.done');
  return out;
}

const chatOf = async (store: KittedStore) => sortMessages(await store.chat.all());
const offerOf = (ms: readonly ChatMessage[]) => ms.filter((m) => m.cardType === 'firstCheckOffer');
const turnOnOf = (ms: readonly ChatMessage[]) => ms.filter((m) => m.cardType === 'turnOnChecks');

/** A store that finished setup through About you with 22–25 (the card is posted). */
async function setUp(): Promise<KittedStore> {
  const store = await fresh();
  await drafts(store, '22-25', 'Alex');
  await finishSetup(store, T0, counterIds());
  return store;
}

function check(id: string, status: FitCheckRow['status'], o: Partial<FitCheckRow> = {}): FitCheckRow {
  return {
    id, createdAt: T1, dayKey: '2026-10-22', photoFile: null, thumbFile: null, demoPhotoId: 'p01b', imageHash: id, occasion: 'everyday', style: null,
    status, isPartial: false, notRated: [], score: status === 'scored' ? 6.5 : null, rawScore: status === 'scored' ? 6.5 : null, subscores: {}, occasionAdj: 0,
    rulesFired: [], credits: [], advice: [], fixes: [], explanation: null, rubricVersion: 'parts', isFavorite: false, snapState: 'none', recheckUsed: false,
    isFirstCheck: true, readingId: null, parentId: null, itemIds: [], details: {}, ...o,
  } as FitCheckRow;
}

// ── OS3.2 · no agreement step ─────────────────────────────────────────────────────────────────────────────────────
describe('OS3.2 · setup has no agreement step', () => {
  it('OS3.2 · an old agreement step and an old link reopen on About you', () => {
    expect(parseStep('consent')).toBe('basics');
    expect(parseStep('basics')).toBe('basics');
    expect(parseStep('looks')).toBe('looks');
    expect(parseStep('1')).toBe('looks');
    expect(parseStep('nonsense')).toBeNull();
    expect(parseStep(null)).toBeNull();
    expect(resumeHref(parseStep('consent'))).toBe('/onboarding/basics');
    expect(resumeHref(parseStep('basics'))).toBe('/onboarding/basics');
    expect(resumeHref(null)).toBe('/onboarding/welcome');
  });
});

// ── OS4.2 / SY4.2 · the name rule ─────────────────────────────────────────────────────────────────────────────────
describe('OS4.2 · the name rule', () => {
  it('OS4.2 · cleanName', () => {
    expect(cleanName('')).toBeNull();
    expect(cleanName('   ')).toBeNull();
    expect(cleanName(null)).toBeNull();
    expect(cleanName(undefined)).toBeNull();
    expect(cleanName('  Alex  ')).toBe('Alex');
    expect(cleanName('Mary Ann')).toBe('Mary Ann');
    expect(cleanName('A'.repeat(40))).toBe('A'.repeat(30));
    expect(cleanName('A'.repeat(30))).toBe('A'.repeat(30));
    // Cut to 30, then trimmed again: never a trailing space.
    expect(cleanName('B'.repeat(29) + ' C')).toBe('B'.repeat(29));
    // Leading spaces don't count against the 30.
    expect(cleanName('   ' + 'D'.repeat(30) + '   ')).toBe('D'.repeat(30));
    expect(NAME_MAX).toBe(30);
  });
});

// ── OS4.3 · the end of setup ──────────────────────────────────────────────────────────────────────────────────────
describe('OS4.3 · finishSetup', () => {
  const cases: { band: AgeBand; typed: string; name: string | null }[] = [
    { band: '18-21', typed: '  Alex ', name: 'Alex' },
    { band: '22-25', typed: '', name: null },
    { band: '26-30', typed: '   ', name: null },
    { band: '31+', typed: 'A'.repeat(40), name: 'A'.repeat(30) },
  ];

  it('OS4.3 · each 18+ band is saved with the time, no birth year, no consent', async () => {
    for (const c of cases) {
      const store = await fresh();
      await drafts(store, c.band, c.typed);
      expect(await store.profile.get('me')).toBeNull();
      await finishSetup(store, T0, counterIds());
      const p = (await store.profile.get('me')) as ProfileRow;
      expect([c.band, {
        ageBand: p.ageBand, ageBandAt: p.ageBandAt, birthYear: p.birthYear, consentVersion: p.consentVersion, consentAt: p.consentAt,
        onboardingDone: p.onboardingDone, fitPreference: p.fitPreference, styles: p.styles, name: p.name,
      }]).toEqual([c.band, {
        ageBand: c.band, ageBandAt: T0, birthYear: null, consentVersion: null, consentAt: null,
        onboardingDone: true, fitPreference: 'relaxed', styles: picksToStyles([...LOOKS]), name: c.name,
      }]);
      const kv = await kvOf(store);
      expect([c.band, kv['onboarding.looks'], kv['onboarding.basics'], kv['onboarding.about'], kv['onboarding.step'], kv['onboarding.otherStyle']])
        .toEqual([c.band, null, null, null, null, 'all black']);
    }
  });

  it('OS4.3 · finishSetup refuses no pick and Under 18', async () => {
    // The same drafts with 22–25 go through (so a refusal below is the rule, not a missing build).
    const ok = await fresh();
    await drafts(ok, '22-25', 'Alex');
    await finishSetup(ok, T0, counterIds());
    expect((await ok.profile.get('me'))?.ageBand).toBe('22-25');

    for (const age of [null, 'under18']) {
      const store = await fresh();
      await drafts(store, age, 'Alex');
      const before = await kvOf(store);
      let threw: unknown = null;
      await finishSetup(store, T0, counterIds()).catch((e: unknown) => {
        threw = e;
      });
      expect([age, threw instanceof Error && threw.message !== 'T39: not built']).toEqual([age, true]);
      expect(await store.profile.get('me')).toBeNull();
      expect(await store.chat.all()).toEqual([]);
      expect(await kvOf(store)).toEqual(before);
    }
  });
});

// ── OS4.6 · the band shown in Style profile ───────────────────────────────────────────────────────────────────────
describe('OS4.6 · the band from a birth year', () => {
  it('OS4.6 · bandFromBirthYear and profileAgeBand', () => {
    const years: [number, string][] = [
      [2009, 'under18'], [2008, '18-21'], [2005, '18-21'], [2004, '22-25'], [2001, '22-25'], [2000, '26-30'], [1996, '26-30'], [1995, '31+'], [1950, '31+'],
    ];
    expect(years.map(([y]) => [y, bandFromBirthYear(y, 2026)])).toEqual(years);

    expect(profileAgeBand({ ageBand: '22-25', birthYear: null }, 2026)).toBe('22-25');
    expect(profileAgeBand({ ageBand: '31+', birthYear: 2005 }, 2026)).toBe('31+');
    expect(profileAgeBand({ birthYear: 2005 }, 2026)).toBe('18-21');
    expect(profileAgeBand({ birthYear: 2009 }, 2026)).toBeNull();
    expect(profileAgeBand({ ageBand: null, birthYear: null }, 2026)).toBeNull();
    expect(profileAgeBand({ ageBand: 'nonsense' as AgeBand, birthYear: null }, 2026)).toBeNull();
  });
});

// ── OS5.1 · Kit's first message, then the offer ───────────────────────────────────────────────────────────────────
describe("OS5.1 · setup's end posts the offer under Kit's first message", () => {
  it("OS5.1 · setup's end posts Kit's first message, then the offer", async () => {
    const store = await fresh();
    await drafts(store, '22-25', 'Alex');
    await finishSetup(store, T0, counterIds());
    const chat = await chatOf(store);

    // What completeOnboarding posts on its own for the same answers (Kit's first message; SY2's hello later).
    const ref = await fresh();
    await completeOnboarding(ref, { styles: picksToStyles([...LOOKS]), fitPreference: 'relaxed', birthYear: null, ageBand: '22-25', name: 'Alex', consent: 'later' }, T0, counterIds());
    const first = (await chatOf(ref)).map((m) => ({ role: m.role, kind: m.kind, cardType: m.cardType, text: m.text, payload: m.payload }));
    expect(first.length).toBeGreaterThan(0);

    expect(chat).toHaveLength(first.length + 1);
    expect(chat.slice(0, first.length).map((m) => ({ role: m.role, kind: m.kind, cardType: m.cardType, text: m.text, payload: m.payload }))).toEqual(first);
    const card = chat[chat.length - 1]!;
    expect({ role: card.role, kind: card.kind, cardType: card.cardType, text: card.text }).toEqual({ role: 'stylist', kind: 'card', cardType: 'firstCheckOffer', text: null });
    for (const m of chat.slice(0, -1)) expect(card.createdAt).toBeGreaterThan(m.createdAt);
    expect(turnOnOf(chat)).toEqual([]);
    expect(offerOf(chat)).toHaveLength(1);
  });
});

// ── OS5.2 · Not now on the agreement ──────────────────────────────────────────────────────────────────────────────
describe('OS5.2 · declineAgreement', () => {
  it('OS5.2 · declineAgreement posts once, only after an offer', async () => {
    // With the offer: today's "Turn on fit checks" message, once, after the card; no consent saved.
    const store = await setUp();
    const card = offerOf(await chatOf(store))[0]!;
    await declineAgreement(store, T1, counterIds());
    let turnOn = turnOnOf(await chatOf(store));
    expect(turnOn.map((m) => ({ role: m.role, kind: m.kind, cardType: m.cardType, text: m.text }))).toEqual([
      { role: 'stylist', kind: 'card', cardType: 'turnOnChecks', text: TURN_ON },
    ]);
    expect(turnOn[0]!.createdAt).toBeGreaterThan(card.createdAt);
    expect((await store.profile.get('me'))?.consentVersion).toBeNull();
    // A second Not now (the camera opened again): still one.
    await declineAgreement(store, T2, counterIds());
    turnOn = turnOnOf(await chatOf(store));
    expect(turnOn).toHaveLength(1);

    // No offer card (an older setup): nothing posted.
    const older = await fresh();
    await older.chat.put(textMessage('M-1', T0, 'stylist', null, { aiNote: true }));
    await declineAgreement(older, T1, counterIds());
    expect((await older.chat.all()).map((m) => m.id)).toEqual(['M-1']);

    // A "Turn on fit checks" message already there: nothing more.
    const already = await setUp();
    await already.chat.put({ ...textMessage('M-99', T0 + 5, 'stylist', TURN_ON), kind: 'card', cardType: 'turnOnChecks' });
    const n = (await already.chat.all()).length;
    await declineAgreement(already, T1, counterIds());
    expect((await already.chat.all()).length).toBe(n);
    expect(turnOnOf(await chatOf(already))).toHaveLength(1);
  });
});

// ── OS5.3 · Later ─────────────────────────────────────────────────────────────────────────────────────────────────
describe('OS5.3 · Later', () => {
  it('OS5.3 · tapLater once', async () => {
    const store = await setUp();
    const card = offerOf(await chatOf(store))[0]!;
    const before = (await store.chat.all()).length;
    await tapLater(store, T1, counterIds());
    expect(await store.getKv(OFFER_LATER_KEY)).toBe(String(T1));
    const chat = await chatOf(store);
    const added = chat.filter((m) => m.text === LATER_LINE);
    expect(chat).toHaveLength(before + 1);
    expect(added.map((m) => ({ role: m.role, kind: m.kind, text: m.text }))).toEqual([{ role: 'stylist', kind: 'text', text: LATER_LINE }]);
    expect(added[0]!.createdAt).toBeGreaterThan(card.createdAt);

    // He sees it with the Kit mark (a new run of Kit's lines after the card).
    const item = buildThreadItems(chat, T1, US_EASTERN).find((i) => i.type === 'msg' && i.message.id === added[0]!.id);
    expect(item && item.type === 'msg' ? item.showWho : null).toBe(true);

    // A second Later: nothing changes.
    await tapLater(store, T2, counterIds());
    expect(await store.getKv(OFFER_LATER_KEY)).toBe(String(T1));
    expect((await store.chat.all()).filter((m) => m.text === LATER_LINE)).toHaveLength(1);
    expect((await store.chat.all()).length).toBe(before + 1);
    // No consent, no turn-on card.
    expect((await store.profile.get('me'))?.consentVersion).toBeNull();
    expect(turnOnOf(await chatOf(store))).toEqual([]);
  });

  it('OS5.3 · "Delete all my data" clears firstCheckOffer.laterAt', async () => {
    const store = await setUp();
    await tapLater(store, T1, counterIds());
    expect(await store.getKv(OFFER_LATER_KEY)).toBe(String(T1));
    await deleteAllData({ store, files: { usage: () => ({ photos: 0, bytes: 0 }), lastSent: () => null, deletePhotos: () => {}, deleteLogs: () => {} }, clearDeviceId: async () => {} });
    expect(await store.getKv(OFFER_LATER_KEY)).toBeNull();
  });
});

// ── OS5.4 · the buttons' rule ─────────────────────────────────────────────────────────────────────────────────────
describe('OS5.4 · when the buttons show', () => {
  it('OS5.4 · offerButtonsShow and loadOfferState', async () => {
    const clear = { laterAt: null, hasScoredCheck: false, declined: false };
    expect(offerButtonsShow(clear)).toBe(true);
    expect(offerButtonsShow({ ...clear, laterAt: T1 })).toBe(false);
    expect(offerButtonsShow({ ...clear, hasScoredCheck: true })).toBe(false);
    expect(offerButtonsShow({ ...clear, declined: true })).toBe(false);

    const store = await setUp();
    expect(await loadOfferState(store)).toEqual(clear);

    // Only checks that weren't scored: still clear.
    const notScored: FitCheckRow['status'][] = ['failed', 'held', 'unreadable', 'notClothed', 'scoring', 'asking'];
    for (const [i, s] of notScored.entries()) await store.fitChecks.put(check(`FC-${i + 1}`, s));
    expect(await loadOfferState(store)).toEqual(clear);

    // A scored first check.
    const first = await setUp();
    await first.fitChecks.put(check('FC-1', 'scored'));
    expect(await loadOfferState(first)).toEqual({ ...clear, hasScoredCheck: true });

    // A scored re-check counts too.
    const re = await setUp();
    await re.fitChecks.put(check('FC-1', 'failed'));
    await re.fitChecks.put(check('FC-2', 'scored', { parentId: 'FC-1', isFirstCheck: false }));
    expect(await loadOfferState(re)).toEqual({ ...clear, hasScoredCheck: true });

    // Later.
    const later = await setUp();
    await tapLater(later, T1, counterIds());
    expect(await loadOfferState(later)).toEqual({ ...clear, laterAt: T1 });

    // Not now on the agreement.
    const declined = await setUp();
    await declineAgreement(declined, T1, counterIds());
    expect(await loadOfferState(declined)).toEqual({ ...clear, declined: true });
  });
});

// ── OS5.6 · an install set up before this change ──────────────────────────────────────────────────────────────────
describe('OS5.6 · an older setup gets no offer', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: new (p: string) => { exec(s: string): void; prepare(s: string): { all(): Record<string, unknown>[] } } };

  it('OS5.6 · V9 adds the columns and posts nothing', () => {
    const db = new DatabaseSync(':memory:');
    for (const m of MIGRATIONS.filter((x) => x.version <= 8)) for (const s of m.statements) db.exec(s);
    db.exec(`INSERT INTO profile (id, birth_year, styles, consent_version, consent_at, onboarding_done, created_at)
      VALUES ('me', 2004, '[["minimalist",0.5]]', '2', 1761000000000, 1, 1761000000000)`);
    db.exec(`INSERT INTO chat_messages (id, created_at, role, kind, text, card_type, payload) VALUES
      ('M-1', 1761000000000, 'stylist', 'text', NULL, NULL, '{"aiNote":true}'),
      ('M-2', 1761000001000, 'user', 'photo', NULL, NULL, '{"photoId":"p01b"}'),
      ('M-3', 1761000002000, 'stylist', 'card', NULL, 'fitCheck', '{}')`);
    const rows = (sql: string) => db.prepare(sql).all().map((r) => ({ ...r }));
    const chatBefore = rows('SELECT * FROM chat_messages ORDER BY id');

    const v9 = MIGRATIONS.find((m) => m.version === 9);
    expect(v9).toBeDefined();
    for (const s of v9!.statements) db.exec(s);

    expect(rows('SELECT * FROM chat_messages ORDER BY id')).toEqual(chatBefore);
    expect(rows('SELECT birth_year, age_band, age_band_at, name FROM profile')).toEqual([{ birth_year: 2004, age_band: null, age_band_at: null, name: null }]);
  });

  it('OS5.6 · an older setup has no offer', async () => {
    const store = createMemoryStore();
    await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: T0 });
    expect(offerOf(await store.chat.all())).toEqual([]);
    const s = await loadOfferState(store);
    expect(Object.keys(s).sort()).toEqual(['declined', 'hasScoredCheck', 'laterAt']);
    expect(s.laterAt).toBeNull();
  });
});
