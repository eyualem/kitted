// Step 4's code-only batch (09-ui-review §20.8): checks written before the code. A scored re-check has Why and Not
// quite right? (G15); Stylist knows when it's offline and says so (G18); "that score is wrong" opens Not quite right?
// (G19); one look's photo can be deleted (G22); "Not now" on consent gets the S26 card (G23); the empty Closet offers
// the basics (G24). Behaviour where it's pure or runs on the memory store; the wiring from source.
import { dayKey, US_EASTERN } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import type { ChatMessage, FitCheckRow } from '@/data/types';
import { cardControls, cardSpoken, correctCard, storedCard } from '@/features/ask/cards';
import { liveAnswer } from '@/features/ask/live';
import { createAsk, type AskDeps } from '@/features/ask/pipeline';
import { createPrepare } from '@/features/ask/prepare';
import type { AnswerEvent, AnswerSource } from '@/features/ask/source';
import { createFitCheckService, DEFAULT_TIMERS } from '@/features/fitcheck/service';
import { deleteCheckPhoto } from '@/features/lookbook/deletePhoto';
import { completeOnboarding } from '@/features/onboarding/complete';
import { isStylistLine } from '@/features/stylist/thread';
import { SCREENS } from '@/demo/scenarios';
import { t } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { BACK_ONLINE_MS, createConnectivity, RECHECK_MS } from '@/services/connectivity';
import { counterIds } from '@/services/ids';
import { demoImagePrep } from '@/services/imagePrep/demo';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { realScheduler } from '@/services/scheduler';

declare const __dirname: string;
const { readFileSync, existsSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string; existsSync(p: string): boolean }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');
const SRC = join(__dirname, '..');
const src = (p: string) => readFileSync(join(SRC, p), 'utf8');

const STYLES = seed.scenarios.firstRun.onboardingAnswers.styles as unknown as [string, number][];

beforeEach(() => liveAnswer.clear());

/** The fit-check service on the memory store with the bundled demo photos (and an optional fault). */
async function checks(o: { fault?: 'offline'; net?: { confirmOffline: () => Promise<boolean>; reportOnline: () => void } } = {}) {
  const store = createMemoryStore();
  const clock = manualClock(Date.parse('2026-10-22T07:42:00-04:00'));
  const source = createMockReadingSource({ latency: () => 0, scheduler: realScheduler, fault: () => o.fault ?? null });
  const quota = createQuota({ store, clock, isPro: () => true });
  const svc = createFitCheckService({
    store, source, prep: demoImagePrep, quota, clock, scheduler: realScheduler, ids: counterIds(),
    timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }), ...(o.net ? { net: o.net } : {}),
  });
  await store.profile.put({
    id: 'me', birthYear: 2005, heightCm: 178, build: 'average', fitPreference: 'regular', styles: STYLES, boldness: null, budget: null,
    lastOccasion: 'everyday', consentVersion: '1', consentAt: clock.nowMs(), onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: clock.nowMs(),
  });
  return { store, svc, clock };
}

// ---------------------------------------------------------------------------------------------------------------- G15
describe('G15 · a scored re-check has Why and Not quite right?', () => {
  const card = src('features/stylist/cards/RecheckCard.tsx');

  it('G15.1 the link row opens the re-check\'s own Why and Not quite right? (Tell me beside them when it shows)', () => {
    expect(card).toMatch(/why: \(\) => router\.push\(`\/sheets\/why\/\$\{row\.id\}`\)/);
    expect(card).toMatch(/nqr: \(\) => router\.push\(`\/sheets\/correct\/\$\{row\.id\}`\)/);
    expect(card).toMatch(/<TextLink title=\{t\('card\.why', \{ score: scoreText \}\)\} onPress=\{go\.why\} compact \/>\s*<TextLink title=\{t\('card\.nqr'\)\} onPress=\{go\.nqr\} compact \/>\s*\{missed \?/);
  });

  it('G15.2–3 VoiceOver gets both as actions; Past chats keep Why only', () => {
    expect(card).toMatch(/: readOnly \? \[fold, why\] : \[[\s\S]*?why, \{ name: 'nqr', label: t\('card\.nqr'\) \}/);
    expect(card).toMatch(/\{readOnly && !notSeen \? \(/);
  });

  it('G15.4 the same-photo and not-seen cards are unchanged (no Why or Not quite right? on them)', () => {
    const same = card.slice(card.indexOf('if (rc.samePhoto) {'), card.indexOf('const notSeen ='));
    expect(same).not.toMatch(/card\.why|card\.nqr/);
    expect(card).toMatch(/const actions = notSeen\s*\? readOnly \? \[\] : \[\{ name: 'iDid'/);
  });

  it('G15.5 a correction on a re-check re-scores the re-check only; its first score and caught fixes stay', async () => {
    const { store, svc } = await checks();
    const { checkId } = (await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
    const first = (await store.fitChecks.get(checkId))!;
    const r = (await svc.start({ mode: 'recheck', photoId: 'p01a', parentCheckId: checkId })) as { outcome: string; checkId: string };
    expect(r.outcome).toBe('scored');
    const before = (await store.fitChecks.get(r.checkId))!;
    const reading = (await store.readings.get(before.readingId!))!.reading;
    const shoes = reading.garments.findIndex((g) => g.category === 'footwear');
    expect(shoes).toBeGreaterThanOrEqual(0);
    const saved = await svc.saveCorrection(r.checkId, { garmentIndex: shoes, field: 'subcategory', value: 'slides' });
    const after = (await store.fitChecks.get(r.checkId))!;
    expect(saved).not.toBeNull();
    expect(after.score).toBe(saved!.after);
    expect(after.score!).toBeLessThan(before.score!);
    expect(after.readingId).not.toBe(before.readingId);
    expect((await store.readings.get(after.readingId!))!.derivedFrom).toBe(before.readingId);
    expect(after.details.recheck).toEqual(before.details.recheck);
    expect((await store.fitChecks.get(checkId))!.score).toBe(first.score);
  });
});

// ---------------------------------------------------------------------------------------------------------------- G18
function fakeTimers() {
  let now = 0;
  const timers: { at: number; fn: () => void; h: number }[] = [];
  let next = 1;
  return {
    scheduler: {
      setTimer: (fn: () => void, ms: number) => {
        const h = next++;
        timers.push({ at: now + ms, fn, h });
        return h;
      },
      clearTimer: (h: unknown) => {
        const i = timers.findIndex((x) => x.h === h);
        if (i >= 0) timers.splice(i, 1);
      },
    },
    async advance(ms: number) {
      now += ms;
      for (;;) {
        const due = timers.filter((x) => x.at <= now).sort((a, b) => a.at - b.at)[0];
        if (!due) break;
        timers.splice(timers.indexOf(due), 1);
        due.fn();
        await Promise.resolve();
        await Promise.resolve();
      }
      await new Promise<void>((r) => setImmediate(() => r()));
    },
    pending: () => timers.length,
  };
}

describe('G18 · offline', () => {
  function net(o: { up?: boolean; active?: boolean } = {}) {
    const ft = fakeTimers();
    const state = { up: o.up ?? true, active: o.active ?? true, probes: 0 };
    const c = createConnectivity({ probe: async () => (state.probes++, state.up), scheduler: ft.scheduler, active: () => state.active });
    let emits = 0;
    c.subscribe(() => emits++);
    return { c, ft, state, emits: () => emits };
  }

  it('G18.1 starts online; a failed call checks before it says offline', async () => {
    const n = net({ up: true });
    expect(n.c.get()).toEqual({ online: true, backOnline: false });
    expect(await n.c.reportOffline()).toBe(false); // one flaky call: the check passes, still online
    expect(n.c.isOnline()).toBe(true);
    expect(n.emits()).toBe(0);
    n.state.up = false;
    expect(await n.c.reportOffline()).toBe(true);
    expect(n.c.get()).toEqual({ online: false, backOnline: false });
  });

  it('G18.1–2 offline re-checks every 10 s in the foreground; "Back online." shows 3 s, then nothing', async () => {
    const n = net({ up: false });
    await n.c.reportOffline();
    const probes = n.state.probes;
    await n.ft.advance(RECHECK_MS);
    expect(n.state.probes).toBe(probes + 1);
    expect(n.c.isOnline()).toBe(false);
    n.state.up = true;
    await n.ft.advance(RECHECK_MS);
    expect(n.c.get()).toEqual({ online: true, backOnline: true });
    await n.ft.advance(BACK_ONLINE_MS);
    expect(n.c.get()).toEqual({ online: true, backOnline: false });
    expect(n.ft.pending()).toBe(0);
  });

  it('G18.1 in the background the re-check waits (the foreground checks again); an answer says online', async () => {
    const n = net({ up: false, active: false });
    await n.c.reportOffline();
    const probes = n.state.probes;
    await n.ft.advance(RECHECK_MS * 3);
    expect(n.state.probes).toBe(probes);
    n.c.reportOnline();
    expect(n.c.get().online).toBe(true);
  });

  it('G18.6 demo screens pin the state; the probe is Apple\'s captive page, a HEAD with nothing of his', async () => {
    const n = net({ up: true });
    n.c.force(false);
    n.c.reportOnline();
    expect(await n.c.reportOffline()).toBe(true);
    expect(n.c.isOnline()).toBe(false);
    expect(n.state.probes).toBe(0);
    n.c.force(true);
    expect(n.c.isOnline()).toBe(true);
    const file = src('services/connectivity.ts');
    expect(file).toMatch(/const PROBE_URL = 'https:\/\/captive\.apple\.com\/hotspot-detect\.html';/);
    expect(file).toMatch(/fetch\(PROBE_URL, \{ method: 'HEAD', cache: 'no-store', signal: ctrl\.signal \}\)/);
    expect(src('app/_layout.tsx')).toMatch(/startConnectivity\(\);/);
    expect(src('demo/prepareDemoScreen.ts')).toMatch(/connectivity\.force\(!sc\.offline\);/);
    expect(SCREENS.find((s) => s.n === 210)).toMatchObject({ offline: true, href: '/stylist' });
  });

  async function ask(events: AnswerEvent[], over: Partial<AskDeps> = {}) {
    const store = createMemoryStore();
    const clock = manualClock(Date.parse('2026-10-22T12:30:00-04:00'));
    const quota = createQuota({ store, clock, isPro: () => false });
    const source: AnswerSource = { name: 's', async *answer() { for (const e of events) yield e; } };
    const a = createAsk({ store, quota, clock, ids: counterIds(), source: () => source, consent: async () => true, openConsent: () => {}, tryPro: () => false, ...over });
    return { store, quota, a };
  }

  it('G18.4 no connection: "You\'re offline, so I couldn\'t answer that." with Retry, nothing counted', async () => {
    const s = await ask([{ type: 'failed', code: 'offline' }], { confirmOffline: async () => true });
    const o = await s.a.ask('What goes with my jeans?');
    expect(o.kind).toBe('sent');
    const r = await (o as { done: Promise<{ kind: string }> }).done;
    expect(r.kind).toBe('failed');
    const line = (await s.store.chat.all()).find((m) => m.role === 'stylist')!;
    expect(line.text).toBe(t('fail.askOffline'));
    expect(t('fail.askOffline')).toBe("You're offline, so I couldn't answer that. It doesn't count.");
    expect(typeof line.payload.askRetry).toBe('string');
    expect((await s.quota.snapshot()).questionsUsed).toBe(0);
  });

  it('G18.4 a call that failed but the phone is online, or any other failure, keeps fail.ask', async () => {
    for (const [code, confirm] of [['offline', false], ['http500', true]] as const) {
      const s = await ask([{ type: 'failed', code }], { confirmOffline: async () => confirm });
      const o = await s.a.ask('What goes with my jeans?');
      await (o as { done: Promise<unknown> }).done;
      expect((await s.store.chat.all()).find((m) => m.role === 'stylist')!.text).toBe(t('fail.ask'));
    }
  });

  it('G18.3 offline: nothing is written and the draft stays; an answer reports online', async () => {
    const s = await ask([{ type: 'delta', text: 'Wear the white tee.' }, { type: 'done' }], { online: () => false });
    expect((await s.a.ask('What goes with my jeans?')).kind).toBe('offline');
    expect(await s.store.chat.all()).toEqual([]);
    let back = 0;
    const s2 = await ask([{ type: 'delta', text: 'Wear the white tee.' }, { type: 'done' }], { reportOnline: () => back++ });
    await (((await s2.a.ask('What goes with my jeans?')) as { done: Promise<unknown> }).done);
    expect(back).toBe(1);
  });

  it('G18.3 the composer\'s send and chips wait while offline; a send that slips through says so', () => {
    expect(src('features/stylist/StylistScreen.tsx')).toMatch(/sendDisabled=\{askInFlight \|\| !net\.online\}/);
    expect(src('features/ask/session.ts')).toMatch(/online: \(\) => connectivity\.isOnline\(\),/);
    expect(src('features/ask/session.ts')).toMatch(/if \(o\.kind === 'offline'\) showToast\(t\('banner\.offline'\)\);/);
    expect(src('features/stylist/Composer.tsx')).toMatch(/<Chip key=\{c\} title=\{c\} small disabled=\{sendDisabled\}/);
  });

  it('G18.2 the banner: banner.offline, then banner.online; no touches, announced once', () => {
    const b = src('features/stylist/OfflineBanner.tsx');
    expect(b).toMatch(/!net\.online \? t\('banner\.offline'\) : net\.backOnline \? t\('banner\.online'\) : null/);
    expect(b).toMatch(/pointerEvents="none"/);
    expect(b).toMatch(/announceForAccessibility/);
    expect(src('features/stylist/StylistScreen.tsx')).toMatch(/<OfflineBanner top=\{space\.xs\} \/>/);
  });

  it('G18.5 a check that failed for no connection: "Not sent" under the photo; else "Not scored"', async () => {
    expect(src('features/stylist/MessageView.tsx')).toMatch(/t\(row\.details\.failCode === 'offline' \? 'fail\.cap\.notSent' : 'fail\.cap\.notScored'\)/);
    const yes = await checks({ fault: 'offline', net: { confirmOffline: async () => true, reportOnline: () => {} } });
    const a = (await yes.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
    expect((await yes.store.fitChecks.get(a.checkId))!.details.failCode).toBe('offline');
    // The call failed but the phone is online: the card doesn't claim "You're offline".
    const no = await checks({ fault: 'offline', net: { confirmOffline: async () => false, reportOnline: () => {} } });
    const b = (await no.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
    expect((await no.store.fitChecks.get(b.checkId))!.details.failCode).toBe('ai');
    let back = 0;
    const ok = await checks({ net: { confirmOffline: async () => true, reportOnline: () => back++ } });
    await ok.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' });
    expect(back).toBe(1);
  });
});

// ---------------------------------------------------------------------------------------------------------------- G19
describe('G19 · "that score is wrong" opens Not quite right?', () => {
  const row = (o: Partial<FitCheckRow>) => ({ id: 'FCa', status: 'scored', score: 6.5, dayKey: '2026-10-22', ...o }) as FitCheckRow;

  it('G19.1 only feedback about today\'s scored check gets the card', () => {
    const handles = { FC1: 'FCa' };
    expect(correctCard({ kind: 'feedback', check: 'FC1' }, handles, [row({})], '2026-10-22')).toEqual({ type: 'correct', checkId: 'FCa' });
    expect(correctCard({ kind: 'feedback', check: 'FC1' }, handles, [row({ dayKey: '2026-10-21' })], '2026-10-22')).toBeNull();
    expect(correctCard({ kind: 'feedback', check: 'FC1' }, handles, [row({ status: 'failed', score: null })], '2026-10-22')).toBeNull();
    expect(correctCard({ kind: 'explain', check: 'FC1' }, handles, [row({})], '2026-10-22')).toBeNull();
    expect(correctCard({ kind: 'feedback', check: null }, handles, [row({})], '2026-10-22')).toBeNull();
  });

  it('G19.2 stored and read back; Past chats show no button; VoiceOver reads "Not quite right?"', () => {
    const c = storedCard({ type: 'correct', checkId: 'FCa' })!;
    expect(c).toEqual({ type: 'correct', checkId: 'FCa' });
    expect(cardSpoken(c, { nameOf: () => null })).toBe(t('card.nqr'));
    expect(cardControls(c, { readOnly: false, tapped: null }).correct).toBe(true);
    expect(cardControls(c, { readOnly: true, tapped: null }).correct).toBe(false);
    const view = src('features/ask/AskCardView.tsx');
    expect(view).toMatch(/case 'correct':\s*return <CorrectRow card=\{card\} readOnly=\{readOnly\} \/>;/);
    expect(view).toMatch(/router\.push\(`\/sheets\/correct\/\$\{card\.checkId\}`\)/);
  });

  it('G19.1, G19.3 through the pipeline: code\'s card replaces the model\'s, and the evidence names the button', async () => {
    const store = createMemoryStore();
    const now = Date.parse('2026-10-22T12:30:00-04:00');
    const clock = manualClock(now);
    await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: Date.parse('2026-10-22T12:04:00-04:00') });
    // Make the newest scored check today's, so "that score" names it.
    const scored = (await store.fitChecks.all()).filter((c) => c.status === 'scored').sort((a, b) => b.createdAt - a.createdAt);
    const target = scored[0]!;
    await store.fitChecks.patch(target.id, { dayKey: dayKey(now, US_EASTERN), createdAt: now - 60_000 });
    let prompt = '';
    const source: AnswerSource = {
      name: 's',
      async *answer(req) {
        prompt = req.prompt?.user ?? '';
        yield { type: 'delta', text: 'Fair to push back. If I read a piece wrong, fix it below.' };
        yield { type: 'done', card: { type: 'check', occasion: 'everyday' } };
      },
    };
    const ids = counterIds();
    const quota = createQuota({ store, clock, isPro: () => true });
    const a = createAsk({ store, quota, clock, ids, source: () => source, prepare: createPrepare({ store, clock, ids }), consent: async () => true, openConsent: () => {}, tryPro: () => false });
    await (((await a.ask('That score is wrong.')) as { done: Promise<unknown> }).done);
    const answer = (await store.chat.all()).find((m: ChatMessage) => typeof m.payload.answerTo === 'string')!;
    expect(answer.payload.askCard).toEqual({ type: 'correct', checkId: target.id });
    expect(prompt).toMatch(/"Not quite right\?" button for this check/);
  });
});

// ---------------------------------------------------------------------------------------------------------------- G22
describe('G22 · delete one look\'s photo', () => {
  it('G22.2 his files go, every holder of the photo loses its paths, the bubble hides; scores and pieces stay', async () => {
    const { store, svc } = await checks();
    const { checkId } = (await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
    const sha = 'ab'.repeat(32);
    const other = 'cd'.repeat(32);
    await store.fitChecks.patch(checkId, { photoFile: `photos/${sha}-photo.jpg`, thumbFile: `photos/${sha}-thumb.jpg`, imageHash: sha, demoPhotoId: null });
    const first = (await store.fitChecks.get(checkId))!;
    // A same-photo re-check holds the same SHA; an unrelated check keeps its photo.
    await store.fitChecks.put({ ...first, id: 'FC-same', parentId: checkId });
    await store.fitChecks.put({ ...first, id: 'FC-other', imageHash: other, photoFile: `photos/${other}-photo.jpg`, thumbFile: null });
    const base = { role: 'user' as const, kind: 'photo' as const, text: null, cardType: null, outfitId: null, itemId: null, chips: [] };
    await store.chat.put({ ...base, id: 'M-photo', createdAt: 1, fitCheckId: checkId, payload: { photoUri: first.photoFile, aspect: 0.75 } });
    await store.chat.put({ ...base, id: 'M-snap', createdAt: 2, fitCheckId: checkId, payload: { photoUri: `photos/${other}-photo.jpg`, snap: true } });
    const obs = (await store.closetObs.all())[0]!;
    const crop = `closet/${sha}-garment-0.png`;
    await store.closetObs.patch(obs.id, { fitCheckId: checkId, cropFile: crop, cropQuality: 0.9 });
    await store.closetObs.put({ ...obs, id: 'O-snap', fitCheckId: checkId, cropFile: `closet/${other}-shoe-0.png` });
    await store.closet.patch(obs.itemId, { cropFile: crop, cropScore: 0.9 });
    const kept: unknown[] = [];
    const closetFiles: string[][] = [];
    const ok = await deleteCheckPhoto({ store, deleteKept: (r) => kept.push(r), deleteClosetFiles: (f) => (closetFiles.push(f), f.length) }, checkId);
    expect(ok).toBe(true);
    for (const id of [checkId, 'FC-same']) expect(await store.fitChecks.get(id)).toMatchObject({ photoFile: null, thumbFile: null, demoPhotoId: null, score: first.score });
    expect((await store.fitChecks.get('FC-other'))!.photoFile).toBe(`photos/${other}-photo.jpg`);
    expect((await store.chat.get('M-photo'))!.payload).toEqual({ aspect: 0.75 });
    expect((await store.chat.get('M-snap'))!.payload.photoUri).toBe(`photos/${other}-photo.jpg`);
    expect(kept).toEqual([expect.objectContaining({ imageHash: sha, photoFile: `photos/${sha}-photo.jpg` })]);
    expect(closetFiles).toEqual([[crop, `closet/${sha}-garment-0.print`]]);
    expect((await store.closetObs.get(obs.id))!.cropFile).toBeNull();
    expect((await store.closetObs.get('O-snap'))!.cropFile).toBe(`closet/${other}-shoe-0.png`);
    expect((await store.closet.get(obs.itemId))).toMatchObject({ cropFile: null, isDeleted: false });
    expect((await store.readings.get(first.readingId!))).toBeTruthy();
    // Nothing left to delete the second time.
    expect(await deleteCheckPhoto({ store, deleteKept: () => {}, deleteClosetFiles: () => 0 }, checkId)).toBe(false);
  });

  it('G22.2 a demo photo just stops showing (no files)', async () => {
    const { store, svc } = await checks();
    const { checkId } = (await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
    expect(await deleteCheckPhoto({ store, deleteKept: () => {}, deleteClosetFiles: () => 0 }, checkId)).toBe(true);
    expect((await store.fitChecks.get(checkId))!.demoPhotoId).toBeNull();
  });

  it('G22.1, G22.3 the ⋯: Delete photo (destructive, with a confirm) while there\'s a photo, Remove from Lookbook then back', () => {
    const page = src('features/lookbook/LookPageScreen.tsx');
    expect(page).toMatch(/headerRight: \(\) => \(\s*<LookMenu\s*hasPhoto=\{!!look\.photo\}\s*onDeletePhoto=\{\(\) => confirmDeletePhoto\(look\.shownId\)\}/);
    expect(page).toMatch(/onRemove=\{\(\) => void removeLookMenu\(look\.checkId, look\.title, \(\) => \(router\.canGoBack\(\) \? router\.back\(\) : router\.replace\('\/lookbook'\)\)\)\}/);
    const menu = src('features/lookbook/LookMenu.ios.tsx');
    expect(menu).toMatch(/\{hasPhoto \? <Button label=\{t\('look\.deletePhoto'\)\} systemImage="trash" role="destructive"/);
    expect(menu).toMatch(/<Button label=\{t\('lookbook\.remove\.action'\)\}/);
    const actions = src('features/lookbook/lookActions.ts');
    expect(actions).toMatch(/Alert\.alert\(t\('look\.delete\.title'\), t\('look\.delete\.msg'\), \[\s*\{ text: t\('common\.cancel'\), style: 'cancel' \},\s*\{\s*text: t\('look\.deletePhoto'\),\s*style: 'destructive'/);
    expect([t('look.delete.title'), t('look.delete.msg')]).toEqual(['Delete this photo?', 'The score stays in your Lookbook.']);
    expect(src('app/(tabs)/lookbook/index.tsx')).toMatch(/removeLookMenu\(checkId, title\)/);
  });
});

// ---------------------------------------------------------------------------------------------------------------- G23
describe('G23 · "Not now" on consent gets the S26 card', () => {
  const answers = { styles: [] as never, heightCm: null, build: '', fitPreference: '', birthYear: 2004 };

  it('G23.1, G23.3 Not now posts the AI note, then Kit\'s line with the card; agreeing posts no card', async () => {
    const store = createMemoryStore();
    await completeOnboarding(store, { ...answers, consent: false }, 1000, counterIds());
    const ms = (await store.chat.all()).sort((a, b) => a.createdAt - b.createdAt);
    expect(ms.map((m) => [m.kind, m.cardType, m.text, m.payload.aiNote ?? null])).toEqual([
      ['text', null, null, true],
      ['card', 'turnOnChecks', t('noConsent.greeting'), null],
    ]);
    expect(isStylistLine(ms[1]!)).toBe(true);
    const agreed = createMemoryStore();
    await completeOnboarding(agreed, { ...answers, consent: true }, 1000, counterIds());
    expect((await agreed.chat.all()).some((m) => m.cardType === 'turnOnChecks')).toBe(false);
  });

  it('G23.1–2, G23.4 the card: its words, both buttons (one VoiceOver element), gone once he agrees', () => {
    const card = src('features/onboarding/NoConsentCard.tsx');
    expect(card).toMatch(/const review = \(\) => router\.push\('\/sheets\/consent'\);/);
    expect(card).toMatch(/const example = \(\) => router\.push\('\/sheets\/example'\);/);
    expect(card).toMatch(/t\('noConsent\.body', \{ provider: t\('config\.providerDefault'\) \}\)/);
    expect(card).toMatch(/\{agreed === false && !readOnly \? \(/);
    expect(card).toMatch(/accessibilityActions=\{\[\{ name: 'review', label: t\('noConsent\.cta'\) \}, \{ name: 'example', label: t\('noConsent\.example'\) \}\]\}/);
    expect(src('features/stylist/MessageView.tsx')).toMatch(/m\.cardType === 'turnOnChecks'\) return <NoConsentCard/);
    expect(t('noConsent.body', { provider: t('config.providerDefault') })).toBe("To score a photo, I need your OK to send a face-free copy to Google's Gemini API.");
  });

  it('G23.1 See an example opens O1e as a sheet; Check my own fit closes it and opens the agreement', () => {
    expect(existsSync(join(SRC, 'app/sheets/example.tsx'))).toBe(true);
    expect(src('app/_layout.tsx')).toMatch(/<Stack\.Screen name="sheets\/example" options=\{sheet\(\[1\]\)\} \/>/);
    const ex = src('features/onboarding/ExampleCheckScreen.tsx');
    expect(ex).toMatch(/if \(sheet\) \{\s*router\.back\(\);\s*setTimeout\(\(\) => router\.push\('\/sheets\/consent'\), 350\);/);
    expect(src('features/account/RestoreScreen.tsx')).toMatch(/consent: false/);
  });
});

// ---------------------------------------------------------------------------------------------------------------- G24
describe('G24 · the empty Closet offers the basics', () => {
  it('Tap the basics you own opens Starter essentials, under Check my fit', () => {
    const closet = src('app/(tabs)/closet/index.tsx');
    const empty = closet.slice(closet.indexOf('<EmptyState icon="closet"'), closet.indexOf('</EmptyState>'));
    expect(empty).toMatch(/t\('closet\.empty\.check'\)[\s\S]*<KButton title=\{t\('closet\.empty\.basics'\)\} kind="secondary"[\s\S]*router\.push\('\/closet\/starter' as Href\)/);
    expect(t('closet.empty.basics')).toBe('Tap the basics you own');
  });
});
