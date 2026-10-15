// 09-ui-review §6.1 (#280), written before the build: the Limit card (02 D19 S17) and its saved state (S17h). A photo
// taken after the free check (and its re-check) is used is kept and held, never read; it's scored once after 4 am.
import { dayKey } from '@kitted/core';
import { PAYWALL_BUILT } from '@/config/features';
import { createMemoryStore } from '@/data/memoryStore';
import type { FitCheckRow } from '@/data/types';
import { demoPhoto } from '@/demo/demoPhotos';
import { explain, startCheck } from '@/features/camera/startCheck';
import { createFitCheckService, DEFAULT_TIMERS } from '@/features/fitcheck/service';
import { fitCheck as appFitCheck } from '@/features/fitcheck/session';
import { createHeldCatchUp } from '@/features/held/catchUp';
import { heldReadyContent, limitCardContent } from '@/features/held/content';
import { showToast } from '@/features/toast/toast';
import { t } from '@/i18n/en';
import { manualClock, parseZonedIso } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { demoImagePrep, type ImagePrep } from '@/services/imagePrep/demo';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { realScheduler } from '@/services/scheduler';

jest.mock('@/features/toast/toast', () => ({ showToast: jest.fn() }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn(), dismissAll: jest.fn() } }));
jest.mock('@/data/db', () => ({ store: {} }));
jest.mock('@/features/fitcheck/session', () => ({ fitCheck: { start: jest.fn(), retry: jest.fn(), pickPerson: jest.fn() } }));
jest.mock('@/services/tempPhoto', () => ({ discardTempPhoto: jest.fn() }));

const fs = jest.requireActual('fs') as {
  writeFileSync(p: string, d: string): void; existsSync(p: string): boolean; mkdtempSync(p: string): string; rmSync(p: string, o?: { recursive?: boolean; force?: boolean }): void;
};
const os = jest.requireActual('os') as { tmpdir(): string };
const path = jest.requireActual('path') as { join(...p: string[]): string };
const at = (iso: string) => parseZonedIso(iso) ?? 0;
const NIGHT = '2026-10-22T21:12:00';
const S15 = demoPhoto('s15')!.sha256;
const S14 = demoPhoto('s14')!.sha256;

/** A real photo (camera or library): his kept copy and thumb written to disk like photo prep does; read by its SHA. */
function filePrep(dir: string, sha = S15): ImagePrep {
  return {
    async prepare(p) {
      if (p.kind === 'demo') return demoImagePrep.prepare(p);
      if (p.kind === 'retry') return { status: 'ok', image: { photoId: null, sha256: p.sha256, uploadUri: null, keptUri: p.keptUri ?? undefined, thumbUri: p.thumbUri ?? undefined } };
      const keptUri = path.join(dir, `${sha.slice(0, 12)}-photo.jpg`);
      const thumbUri = path.join(dir, `${sha.slice(0, 12)}-thumb.jpg`);
      fs.writeFileSync(keptUri, 'kept');
      fs.writeFileSync(thumbUri, 'thumb');
      return { status: 'ok', image: { photoId: null, sha256: sha, uploadUri: null, keptUri, thumbUri, aspect: 0.75 } };
    },
  };
}

async function setup(o: { pro?: boolean; now?: string; prep?: ImagePrep } = {}) {
  const store = createMemoryStore();
  const clock = manualClock(at(o.now ?? '2026-10-22T20:30:00'));
  const source = createMockReadingSource({ latency: () => 0, scheduler: realScheduler });
  const reads = jest.spyOn(source, 'read');
  const quota = createQuota({ store, clock, isPro: () => o.pro === true });
  const deleted: string[] = [];
  const svc = createFitCheckService({
    store, source, prep: o.prep ?? demoImagePrep, quota, clock, scheduler: realScheduler, ids: counterIds(),
    timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }),
    deleteHeldFiles: (row) => {
      for (const f of [row.photoFile, row.thumbFile]) {
        if (!f) continue;
        deleted.push(f);
        fs.rmSync(f, { force: true });
      }
    },
  });
  await store.profile.put({
    id: 'me', birthYear: 2004, heightCm: 178, build: 'average', fitPreference: 'regular', styles: [['minimalist', 0.5]], boldness: null, budget: null,
    lastOccasion: 'everyday', consentVersion: '1', consentAt: clock.nowMs(), onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: clock.nowMs(),
  });
  return { store, clock, svc, quota, source, reads, deleted };
}

type Env = Awaited<ReturnType<typeof setup>>;
const idOf = (r: unknown) => (r as { checkId: string }).checkId;

/** Today's free check, scored, and (unless `recheck: false`) its re-check used. */
async function spendToday(env: Env, o: { recheck?: boolean } = {}) {
  const first = idOf(await env.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' }));
  expect((await env.store.fitChecks.get(first))!.status).toBe('scored');
  if (o.recheck !== false) {
    expect((await env.svc.start({ mode: 'recheck', photoId: 'p01a', parentCheckId: first })).outcome).toBe('scored');
  }
  return first;
}

async function holdAt(env: Env, iso: string, input: { photoId: string } | { photoUri: string } = { photoId: 's15' }) {
  env.clock.set(at(iso));
  const r = await env.svc.start({ mode: 'check', occasion: 'everyday', ...input });
  expect(r.outcome).toBe('held');
  return idOf(r);
}

const cardsFor = async (env: Env, checkId: string) => (await env.store.chat.all()).filter((m) => m.fitCheckId === checkId);
const usageOn = async (env: Env, ms: number) => (await env.store.usage.get(dayKey(ms, env.clock.offset))) ?? { checks: 0, rechecks: 0, questions: 0 };

let tmp: string;
beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kitted-held-'));
  jest.mocked(showToast).mockClear();
});
afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

describe('the Limit card (§6.1)', () => {
  test('L1: check and re-check used, a new photo (camera or library): nothing read, nothing counted, the Limit card posted', async () => {
    for (const input of [{ photoId: 's15' }, { photoUri: 'file:///tmp/kitted-capture-1.jpg' }] as const) {
      const env = await setup({ prep: filePrep(tmp) });
      await spendToday(env);
      const before = await usageOn(env, env.clock.nowMs());
      const readsBefore = env.reads.mock.calls.length;
      const id = await holdAt(env, NIGHT, input);
      // The reading service is never called and today's count doesn't move.
      expect(env.reads.mock.calls.length).toBe(readsBefore);
      const after = await usageOn(env, env.clock.nowMs());
      expect([after.checks, after.rechecks]).toEqual([before.checks, before.rechecks]);
      // His photo and the inline card in the thread.
      const ms = await cardsFor(env, id);
      expect(ms.map((m) => [m.role, m.kind, m.cardType])).toEqual([['user', 'photo', null], ['stylist', 'card', 'held']]);
      const row = (await env.store.fitChecks.get(id))!;
      const c = limitCardContent(row, await env.quota.snapshot(), { paywallBuilt: false })!;
      expect([c.state, c.tag, c.tagRight, c.title]).toEqual(['limit', 'Daily limit', 'Resets 4 am', "That's today's free check."]);
      expect(c.body).toBe(t('limit.body', { n: 5 }));
      expect(c.body).toBe("I'll save this photo and score it when you open Kitted after 4 am. Questions still work tonight: 5 left.");
      expect(c.save).toBe('Save for tomorrow');
      expect(c.tryPro).toBeNull();
    }
  });

  test('L1: no questions left → the no-questions body; "Try Pro" only when the paywall is built', async () => {
    const env = await setup();
    await spendToday(env);
    const id = await holdAt(env, NIGHT);
    const day = dayKey(env.clock.nowMs(), env.clock.offset);
    const u = (await env.store.usage.get(day))!;
    await env.store.usage.put({ ...u, questions: 5 });
    const row = (await env.store.fitChecks.get(id))!;
    const s = await env.quota.snapshot();
    expect(limitCardContent(row, s, { paywallBuilt: false })!.body).toBe("I'll save this photo and score it when you open Kitted after 4 am.");
    expect(limitCardContent(row, s, { paywallBuilt: true })!.tryPro).toBe('Try Pro · 14 days free');
    expect(limitCardContent(row, s, { paywallBuilt: true, trialUsed: true })!.tryPro).toBe('Try Pro');
    // The app's default follows the PAYWALL_BUILT switch.
    expect(limitCardContent(row, s)!.tryPro !== null).toBe(PAYWALL_BUILT);
  });

  test('L2: the photo is kept on the phone and the check is held; ignoring the card leaves it held', async () => {
    const env = await setup({ prep: filePrep(tmp) });
    await spendToday(env);
    const id = await holdAt(env, NIGHT, { photoUri: 'file:///tmp/kitted-capture-2.jpg' });
    let row = (await env.store.fitChecks.get(id))!;
    expect(row.status).toBe('held');
    expect(row.photoFile).toBeTruthy();
    expect(fs.existsSync(row.photoFile!)).toBe(true);
    expect(row.score).toBeNull();
    // He ignores it; an hour later (same day) the app comes back: still held, still on the phone, nothing read.
    const readsBefore = env.reads.mock.calls.length;
    env.clock.set(at('2026-10-22T22:30:00'));
    await env.svc.onAppOpen();
    row = (await env.store.fitChecks.get(id))!;
    expect(row.status).toBe('held');
    expect(fs.existsSync(row.photoFile!)).toBe(true);
    expect(env.reads.mock.calls.length).toBe(readsBefore);
    expect((await env.quota.snapshot()).heldCount).toBe(1);
  });

  test('L3: Save for tomorrow turns the card into the saved state', async () => {
    const env = await setup();
    await spendToday(env);
    const id = await holdAt(env, NIGHT);
    await env.svc.saveHeld(id);
    const row = (await env.store.fitChecks.get(id))!;
    expect(row.status).toBe('held');
    const c = limitCardContent(row, await env.quota.snapshot(), { paywallBuilt: false })!;
    expect([c.state, c.tag, c.tagRight]).toEqual(['saved', 'Waiting to score', 'After 4 am']);
    expect(c.body).toBe("Saved. I'll score it when you open Kitted after 4 am. It uses tomorrow's free check.");
    expect(c.dontScore).toBe("Don't score it");
    expect([c.save, c.tryPro, c.title]).toEqual([null, null, null]);
    // The same card in the thread (it changes in place, never a second card).
    expect((await cardsFor(env, id)).filter((m) => m.kind === 'card')).toHaveLength(1);
  });

  test("L4: Don't score it: the held photo is never scored, now or after 4 am", async () => {
    const env = await setup({ prep: filePrep(tmp) });
    await spendToday(env);
    const id = await holdAt(env, NIGHT, { photoUri: 'file:///tmp/kitted-capture-3.jpg' });
    const kept = (await env.store.fitChecks.get(id))!.photoFile!;
    await env.svc.saveHeld(id);
    expect(await env.svc.dropHeld(id)).toBe(true);
    const gone = await env.store.fitChecks.get(id);
    expect(gone === null || gone.status !== 'held').toBe(true);
    // It was never sent: his kept copy goes too.
    expect(fs.existsSync(kept)).toBe(false);
    const readsBefore = env.reads.mock.calls.length;
    await env.svc.onAppOpen();
    env.clock.set(at('2026-10-23T08:00:00'));
    await env.svc.onAppOpen();
    expect(env.reads.mock.calls.length).toBe(readsBefore);
    expect((await env.store.fitChecks.all()).filter((c) => c.imageHash === S15 && c.status === 'scored')).toHaveLength(0);
    expect((await usageOn(env, env.clock.nowMs())).checks).toBe(0);
    expect(await env.svc.dropHeld(id)).toBe(false);
  });

  // L5 was amended before this fix (#281): L5′ follows ruling 27 and S17h, a held photo is never sent on its own.
  const readyFor = async (env: Env, checkId?: string) =>
    (await env.store.chat.all()).filter((m) => m.role === 'stylist' && m.payload.ready === true && (!checkId || m.fitCheckId === checkId));
  const fullReads = (env: Env) => env.reads.mock.calls.filter((c) => c[1] === 'full').length;

  test('L5′: past the next 4 am, launch or a foreground posts "Ready to score last night\'s photo?" once; nothing is read or sent before he taps', async () => {
    const env = await setup();
    await spendToday(env);
    const id = await holdAt(env, NIGHT);
    await env.svc.saveHeld(id);
    const before = fullReads(env);
    // Before 4 am it's still the same day: nothing.
    env.clock.set(at('2026-10-23T03:59:00'));
    await env.svc.onAppOpen();
    expect(await readyFor(env)).toHaveLength(0);
    // After 4 am: launch and a foreground at once, then two more returns.
    env.clock.set(at('2026-10-23T07:30:00'));
    await Promise.all([env.svc.onAppOpen(), env.svc.onAppOpen()]);
    await env.svc.onAppOpen();
    env.clock.set(at('2026-10-23T09:00:00'));
    await env.svc.onAppOpen();
    // Nothing read, sent or counted; the photo is still held.
    expect(fullReads(env)).toBe(before);
    expect((await env.store.fitChecks.get(id))!.status).toBe('held');
    expect((await usageOn(env, env.clock.nowMs())).checks).toBe(0);
    // The message, once, in today's thread, with its two buttons.
    const ready = await readyFor(env, id);
    expect(ready).toHaveLength(1);
    expect(dayKey(ready[0]!.createdAt, env.clock.offset)).toBe(dayKey(env.clock.nowMs(), env.clock.offset));
    const c = heldReadyContent((await env.store.fitChecks.get(id))!)!;
    expect([c.text, c.score, c.notThis]).toEqual(["Ready to score last night's photo?", 'Score it', 'Not this one']);
  });

  test('L5′: "Score it" scores that photo exactly once, on that day\'s free check', async () => {
    const env = await setup();
    await spendToday(env);
    const nightMs = at(NIGHT);
    const id = await holdAt(env, NIGHT);
    env.clock.set(at('2026-10-23T07:30:00'));
    await env.svc.onAppOpen();
    expect((await env.store.fitChecks.get(id))!.status).toBe('held');
    const before = fullReads(env);
    // A double tap, then a third.
    await Promise.all([env.svc.scoreHeldNow(id), env.svc.scoreHeldNow(id)]);
    await env.svc.scoreHeldNow(id);
    await env.svc.onAppOpen();
    expect(fullReads(env) - before).toBe(1);
    const row = (await env.store.fitChecks.get(id))!;
    expect(row.status).toBe('scored');
    expect(row.score).not.toBeNull();
    expect((await usageOn(env, env.clock.nowMs())).checks).toBe(1);
    expect((await usageOn(env, nightMs)).checks).toBe(1);
    // The score lands in today's thread: his photo and one fit-check card; the question has done its job.
    const ms = await cardsFor(env, id);
    expect(ms.filter((m) => m.payload.ready !== true).map((m) => [m.kind, m.cardType])).toEqual([['photo', null], ['card', 'fitCheck']]);
    for (const m of ms) expect(dayKey(m.createdAt, env.clock.offset)).toBe(dayKey(env.clock.nowMs(), env.clock.offset));
    expect(heldReadyContent(row)).toBeNull();
  });

  test('L5′: never more photos are scored than that day allows', async () => {
    const env = await setup();
    await spendToday(env);
    const a = await holdAt(env, NIGHT, { photoId: 's15' });
    const b = await holdAt(env, '2026-10-22T21:40:00', { photoId: 's14' });
    env.clock.set(at('2026-10-23T07:30:00'));
    await env.svc.onAppOpen();
    expect([(await env.store.fitChecks.get(a))!.status, (await env.store.fitChecks.get(b))!.status]).toEqual(['held', 'held']);
    await env.svc.scoreHeldNow(a);
    await env.svc.scoreHeldNow(b);
    await env.svc.onAppOpen();
    const rows = [(await env.store.fitChecks.get(a))!, (await env.store.fitChecks.get(b))!];
    expect(rows.map((r) => r.status)).toEqual(['scored', 'held']);
    expect((await usageOn(env, env.clock.nowMs())).checks).toBe(1);
    expect(env.reads.mock.calls.filter((c) => c[1] === 'full' && [S15, S14].includes((c[0] as { sha256: string }).sha256)).length).toBe(1);
    // Today's check is used: no question for the second photo today.
    expect(await readyFor(env, b)).toHaveLength(0);
  });

  test('L5′: "Not this one" deletes the photo and its files (it was never sent)', async () => {
    const env = await setup({ prep: filePrep(tmp) });
    await spendToday(env);
    const id = await holdAt(env, NIGHT, { photoUri: 'file:///tmp/kitted-capture-5.jpg' });
    const row = (await env.store.fitChecks.get(id))!;
    env.clock.set(at('2026-10-23T07:30:00'));
    await env.svc.onAppOpen();
    expect(await readyFor(env, id)).toHaveLength(1);
    const before = fullReads(env);
    expect(await env.svc.dropHeld(id)).toBe(true);
    expect(await env.store.fitChecks.get(id)).toBeNull();
    for (const f of [row.photoFile!, row.thumbFile!]) expect(fs.existsSync(f)).toBe(false);
    expect(env.deleted).toEqual(expect.arrayContaining([row.photoFile, row.thumbFile]));
    expect(await cardsFor(env, id)).toHaveLength(0);
    await env.svc.onAppOpen();
    expect(fullReads(env)).toBe(before);
    expect((await usageOn(env, env.clock.nowMs())).checks).toBe(0);
  });

  test('L5′: a photo he chose "Don\'t score it" for never gets the message', async () => {
    const env = await setup();
    await spendToday(env);
    const id = await holdAt(env, NIGHT);
    await env.svc.saveHeld(id);
    await env.svc.dropHeld(id);
    env.clock.set(at('2026-10-23T07:30:00'));
    await env.svc.onAppOpen();
    env.clock.set(at('2026-10-24T07:30:00'));
    await env.svc.onAppOpen();
    expect(await readyFor(env)).toHaveLength(0);
  });

  test('L5′: the check for held photos runs at launch and every time the app comes back to the foreground', () => {
    const run = jest.fn(() => Promise.resolve([]));
    const listeners: ((s: string) => void)[] = [];
    createHeldCatchUp(run, (cb) => listeners.push(cb));
    expect(run).toHaveBeenCalledTimes(1);
    listeners.forEach((l) => l('background'));
    expect(run).toHaveBeenCalledTimes(1);
    listeners.forEach((l) => l('active'));
    expect(run).toHaveBeenCalledTimes(2);
  });

  test("L6: when today's re-check is still open, the card says so", async () => {
    const env = await setup();
    await spendToday(env, { recheck: false });
    const s0 = await env.quota.snapshot();
    expect(s0.recheckOpen).toBe(true);
    // Inside the first check's re-check window (it's the first-ever check: open until 4 am).
    const id = await holdAt(env, '2026-10-22T20:45:00');
    const row = (await env.store.fitChecks.get(id))!;
    const c = limitCardContent(row, await env.quota.snapshot(), { paywallBuilt: false })!;
    expect(c.body).toBe(`${t('limit.body', { n: 5 })} Today's re-check still works.`);
  });

  test('L7: a Pro user under 10 checks a day never sees the card', async () => {
    const env = await setup({ pro: true });
    for (const [i, photoId] of ['p01b', 's15', 's14', 's24', 'p01a', 's12', 'p01b2', 'ph1', 'ph8'].entries()) {
      env.clock.set(at('2026-10-22T09:00:00') + i * 60 * 60_000);
      const r = await env.svc.start({ mode: 'check', photoId, occasion: 'everyday' });
      expect(r.outcome).not.toBe('held');
      expect(r.outcome).not.toBe('limit');
    }
    expect((await env.store.chat.all()).filter((m) => m.cardType === 'held')).toHaveLength(0);
    expect((await env.store.fitChecks.all()).filter((c: FitCheckRow) => c.status === 'held')).toHaveLength(0);
  });

  test('L8: the old "Check used today" toast no longer appears on this path', async () => {
    // The real service's answer to a photo over the free limit, through the same explain() startCheck runs.
    const env = await setup();
    await spendToday(env);
    env.clock.set(at(NIGHT));
    explain(await env.svc.start({ mode: 'check', photoId: 's15', occasion: 'everyday' }));
    expect(showToast).not.toHaveBeenCalled();
    explain({ outcome: 'held', checkId: 'FC-9' });
    expect(showToast).not.toHaveBeenCalled();
    jest.mocked(appFitCheck.start).mockResolvedValueOnce({ outcome: 'held', checkId: 'FC-9' });
    await startCheck('check', { photoUri: 'file:///tmp/kitted-capture-4.jpg' });
    expect(showToast).not.toHaveBeenCalled();
    expect(jest.mocked(showToast).mock.calls.flat()).not.toContain(t('stylist.quota.used'));
  });
});
