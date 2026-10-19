// The waitlist function's checks F1–F13 (handoff/15-landing-page.md §8), on the Firestore emulator.
// The handler runs in this process behind a local HTTP server with the real Admin Firestore, like api.test.ts.
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Firestore } from 'firebase-admin/firestore';
import { assertFails, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const PROJECT = 'demo-kitted';
const SECRET = 'waitlist-secret-5e1d';
const ORIGIN = 'https://trykitted.com';
const IP = '203.0.113.77';

type HandlerMod = typeof import('../functions/src/waitlist/handler');
type AdminMod = typeof import('../functions/src/waitlist/admin');
let handler: HandlerMod;
let admin: AdminMod;

// The functions' own copy of the Admin SDK (index.adminFirestore), so FieldValue and the Firestore instance match.
let db: Firestore;
let server: Server;
let base = '';
let clockMs = Date.UTC(2026, 9, 20, 17, 0); // 1 pm in New York, Oct 20
let logs: Record<string, unknown>[] = [];
let rulesEnv: RulesTestEnvironment;

interface PostOpts { origin?: string | null; ip?: string; raw?: string; type?: string; method?: string }
async function post(route: string, body: unknown, o: PostOpts = {}) {
  const headers: Record<string, string> = { 'content-type': o.type ?? 'application/json', 'x-forwarded-for': `${o.ip ?? IP}, 10.0.0.1` };
  const origin = o.origin === undefined ? ORIGIN : o.origin;
  if (origin) headers.origin = origin;
  return fetch(`${base}/api/waitlist/${route}`, { method: o.method ?? 'POST', headers, ...(o.method === 'GET' ? {} : { body: o.raw ?? JSON.stringify(body) }) });
}
const join = (over: Record<string, unknown> = {}, o: PostOpts = {}) =>
  post('join', { email: 'Sam.Rivera@Example.com', platform: 'ios', adult: true, src: 'tiktok', device: 'iphone', website: '', ...over }, o);
const json = async (r: Response) => (await r.json()) as Record<string, unknown>;
const rows = async (c: string) => (await db.collection(c).get()).docs.map((d) => ({ id: d.id, ...d.data() }));
const day = () => '2026-10-20';

beforeAll(async () => {
  process.env.GCLOUD_PROJECT = PROJECT;
  process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: PROJECT, storageBucket: 'demo-kitted.appspot.com' });
  db = (await import('../functions/src/index')).adminFirestore();
  handler = await import('../functions/src/waitlist/handler');
  admin = await import('../functions/src/waitlist/admin');
  const h = handler.createWaitlist({
    db,
    secret: () => SECRET,
    origins: [ORIGIN, 'https://kitted-a5b45.web.app'],
    now: () => clockMs,
    log: (e) => logs.push(e),
  });
  server = createServer((req, res) => {
    void h(req, res).catch(() => {
      if (!res.headersSent) res.writeHead(500).end();
    });
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  rulesEnv = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});

afterAll(async () => {
  await new Promise((r) => server.close(r));
  await rulesEnv.cleanup();
});

beforeEach(async () => {
  for (const c of ['waitlist', 'waitlist_stats', 'waitlist_rate']) await db.recursiveDelete(db.collection(c));
  clockMs = Date.UTC(2026, 9, 20, 17, 0);
  logs = [];
});

describe('F1 a valid signup', () => {
  it('is stored once, trimmed and lowercased, with platform, src, device and day', async () => {
    const r = await join({ email: '  Sam.Rivera@Example.com ' });
    expect(r.status).toBe(200);
    expect(await json(r)).toEqual({ ok: true });
    const all = await rows('waitlist');
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({
      id: handler.emailId('sam.rivera@example.com'),
      email: 'sam.rivera@example.com', platform: 'ios', adult: true, src: 'tiktok', device: 'iphone', day: day(),
      batch: null, invitedAt: null, unsubscribed: false,
    });
  });

  it('keeps an unknown src or device as "other", and Android signups too', async () => {
    await join({ email: 'a@b.co', platform: 'android', src: 'spam<script>', device: 'toaster' });
    const [row] = await rows('waitlist');
    expect(row).toMatchObject({ platform: 'android', src: 'other', device: 'other' });
  });

  it('accepts a text/plain body (the way sendBeacon posts)', async () => {
    const r = await join({}, { type: 'text/plain;charset=UTF-8' });
    expect(r.status).toBe(200);
    expect(await rows('waitlist')).toHaveLength(1);
  });
});

describe('F2 the same email again', () => {
  it('stays one document and gets the same answer', async () => {
    const a = await json(await join());
    clockMs += 3_600_000;
    const r = await join({ email: 'SAM.rivera@example.com  ', platform: 'android', src: 'ig' });
    expect(r.status).toBe(200);
    expect(await json(r)).toEqual(a);
    const all = await rows('waitlist');
    expect(all).toHaveLength(1);
    // The platform follows the newest answer; where they first came from stays.
    expect(all[0]).toMatchObject({ platform: 'android', src: 'tiktok', day: day() });
  });

  it('a re-join after unsubscribing subscribes again (a new, explicit opt-in)', async () => {
    await join();
    await db.doc(`waitlist/${handler.emailId('sam.rivera@example.com')}`).update({ unsubscribed: true });
    await join();
    expect((await rows('waitlist'))[0]).toMatchObject({ unsubscribed: false });
  });
});

describe('F3 without "18 or older"', () => {
  it('is refused and nothing is stored', async () => {
    for (const adult of [false, undefined, 'yes', 1]) {
      const r = await join({ adult });
      expect(r.status).toBe(400);
      expect(await json(r)).toEqual({ error: 'adult' });
    }
    expect(await rows('waitlist')).toHaveLength(0);
  });
});

describe('F4 bad input', () => {
  it('a bad email is refused', async () => {
    for (const email of ['', 'sam', 'sam@', '@example.com', 'sam@example', 'sam rivera@example.com', `${'a'.repeat(250)}@example.com`, 42]) {
      const r = await join({ email });
      expect(r.status).toBe(400);
      expect(await json(r)).toEqual({ error: 'email' });
    }
    expect(await rows('waitlist')).toHaveLength(0);
  });

  it('a bad platform is refused', async () => {
    const r = await join({ platform: 'windows' });
    expect(r.status).toBe(400);
    expect(await json(r)).toEqual({ error: 'platform' });
  });

  it('a body over 2 KB or not JSON is refused', async () => {
    expect((await join({ src: 'x'.repeat(2100) })).status).toBe(413);
    expect((await join({}, { raw: '{"email": ' })).status).toBe(400);
    expect((await join({}, { raw: '[1,2]' })).status).toBe(400);
    expect(await rows('waitlist')).toHaveLength(0);
  });
});

describe('F5 the hidden trap field', () => {
  it('answers success and stores nothing', async () => {
    const r = await join({ website: 'http://spam.example' });
    expect(r.status).toBe(200);
    expect(await json(r)).toEqual({ ok: true });
    expect(await rows('waitlist')).toHaveLength(0);
    expect(await rows('waitlist_stats')).toHaveLength(0);
  });
});

describe('F6 too many tries from one address', () => {
  it('the 11th try in an hour gets 429 and nothing is stored', async () => {
    for (let i = 0; i < 10; i++) expect((await join({ email: `p${i}@example.com` })).status).toBe(200);
    const r = await join({ email: 'p10@example.com' });
    expect(r.status).toBe(429);
    expect(await json(r)).toEqual({ error: 'rate' });
    expect(await rows('waitlist')).toHaveLength(10);
  });

  it('counts per address, and a new hour starts over', async () => {
    for (let i = 0; i < 10; i++) await join({ email: `p${i}@example.com` });
    expect((await join({ email: 'other@example.com' }, { ip: '198.51.100.4' })).status).toBe(200);
    clockMs += 3_600_000;
    expect((await join({ email: 'p11@example.com' })).status).toBe(200);
  });

  it('never writes the raw address anywhere', async () => {
    await join();
    await post('visit', { src: 'tiktok', device: 'iphone' });
    for (const c of ['waitlist', 'waitlist_stats', 'waitlist_rate']) {
      const snap = await db.collection(c).get();
      for (const d of snap.docs) expect(JSON.stringify({ id: d.id, ...d.data() })).not.toContain(IP);
    }
    expect(JSON.stringify(logs)).not.toContain(IP);
  });

  it('rate docs older than a day are purged', async () => {
    await join();
    expect(await rows('waitlist_rate')).toHaveLength(1);
    expect(await admin.purgeRateBefore(db, clockMs - 86_400_000)).toBe(0);
    expect(await admin.purgeRateBefore(db, clockMs + 1)).toBe(1);
    expect(await rows('waitlist_rate')).toHaveLength(0);
  });
});

describe('F7 the rules', () => {
  it("no app or browser can read, list or write the waitlist or its counts", async () => {
    await join();
    const id = handler.emailId('sam.rivera@example.com');
    for (const ctx of [rulesEnv.unauthenticatedContext(), rulesEnv.authenticatedContext('alice')]) {
      const fs = ctx.firestore();
      await assertFails(getDoc(doc(fs, `waitlist/${id}`)));
      await assertFails(getDocs(collection(fs, 'waitlist')));
      await assertFails(setDoc(doc(fs, 'waitlist/x'), { email: 'x@example.com' }));
      await assertFails(getDoc(doc(fs, `waitlist_stats/${day()}`)));
      await assertFails(getDocs(collection(fs, 'waitlist_stats')));
      await assertFails(setDoc(doc(fs, `waitlist_stats/${day()}`), { visits_tiktok: 999 }));
      await assertFails(getDocs(collection(fs, 'waitlist_rate')));
    }
  });
});

describe('F8 method and origin', () => {
  it('only POST, only from our own origins', async () => {
    expect((await join({}, { origin: 'https://evil.example' })).status).toBe(403);
    expect((await join({}, { origin: null })).status).toBe(403);
    expect((await post('join', null, { method: 'GET' })).status).toBe(405);
    expect((await post('join', {}, { method: 'PUT' })).status).toBe(405);
    expect((await post('nope', {})).status).toBe(404);
    expect(await rows('waitlist')).toHaveLength(0);
    expect((await join({}, { origin: 'https://kitted-a5b45.web.app' })).status).toBe(200);
  });
});

describe('F9 the logs', () => {
  it('never hold an email', async () => {
    await join();
    await join({ email: 'bad@' });
    await join({ website: 'x' });
    expect(logs.length).toBeGreaterThan(0);
    const text = JSON.stringify(logs).toLowerCase();
    expect(text).not.toContain('sam.rivera');
    expect(text).not.toContain('example.com');
    expect(text).not.toContain(handler.emailId('sam.rivera@example.com'));
  });
});

describe('F10 counts', () => {
  it('a visit and a signup add one to that day\'s counts for their src and device', async () => {
    expect((await post('visit', { src: 'tiktok', device: 'iphone' })).status).toBe(204);
    await post('visit', { src: 'qr', device: 'desktop' });
    await join();
    await join(); // the same email again isn't a second signup
    const stats = (await db.doc(`waitlist_stats/${day()}`).get()).data();
    expect(stats).toMatchObject({
      visits_tiktok: 1, visits_qr: 1, visits_device_iphone: 1, visits_device_desktop: 1,
      signups_tiktok: 1, signups_device_iphone: 1, signups_platform_ios: 1,
    });
  });

  it('a visit from a bad origin isn\'t counted', async () => {
    await post('visit', { src: 'tiktok', device: 'iphone' }, { origin: 'https://evil.example' });
    expect(await rows('waitlist_stats')).toHaveLength(0);
  });

  it('a flood of visits from one address stops counting after 60 an hour', async () => {
    for (let i = 0; i < 65; i++) await post('visit', { src: 'tiktok', device: 'iphone' });
    expect((await db.doc(`waitlist_stats/${day()}`).get()).data()?.visits_tiktok).toBe(60);
  });

  it('the day is New York\'s', async () => {
    clockMs = Date.UTC(2026, 9, 21, 2, 0); // 10 pm Oct 20 in New York
    await post('visit', { src: 'tiktok', device: 'iphone' });
    expect((await db.doc('waitlist_stats/2026-10-20').get()).exists).toBe(true);
  });
});

describe('F11 the export', () => {
  it('marks exactly the batch it returns, oldest first, never Android or unsubscribed', async () => {
    const add = async (email: string, platform = 'ios') => {
      await join({ email, platform });
      clockMs += 60_000;
    };
    await add('one@example.com');
    await add('droid@example.com', 'android');
    await add('two@example.com');
    await add('gone@example.com');
    await add('three@example.com');
    await db.doc(`waitlist/${handler.emailId('gone@example.com')}`).update({ unsubscribed: true });

    const first = await admin.exportBatch(db, { batch: 1, size: 2, now: clockMs });
    expect(first.map((r) => r.email)).toEqual(['one@example.com', 'two@example.com']);
    const second = await admin.exportBatch(db, { batch: 2, size: 5, now: clockMs });
    expect(second.map((r) => r.email)).toEqual(['three@example.com']);

    const byEmail = Object.fromEntries((await rows('waitlist')).map((r) => [r.email as string, r]));
    expect(byEmail['one@example.com']).toMatchObject({ batch: 1, invitedAt: clockMs });
    expect(byEmail['three@example.com']).toMatchObject({ batch: 2 });
    expect(byEmail['droid@example.com']).toMatchObject({ batch: null });
    expect(byEmail['gone@example.com']).toMatchObject({ batch: null });
    expect(admin.toTestFlightCsv(first)).toBe('First Name,Last Name,Email\n,,one@example.com\n,,two@example.com\n');
  });
});

describe('F12 unsubscribe', () => {
  it('the signed link sets unsubscribed; a guessed one does nothing', async () => {
    await join();
    await join({ email: 'other@example.com' });
    const id = handler.emailId('sam.rivera@example.com');
    const otherId = handler.emailId('other@example.com');
    const token = handler.unsubscribeToken(SECRET, id);

    // GET shows a page with a button and changes nothing (mail scanners open links).
    const page = await fetch(`${base}/api/waitlist/unsubscribe?id=${id}&t=${token}`);
    expect(page.status).toBe(200);
    expect(await page.text()).toContain('<form');
    expect((await rows('waitlist')).every((r) => r.unsubscribed === false)).toBe(true);

    // The other email's id with this email's token: refused.
    const wrong = await fetch(`${base}/api/waitlist/unsubscribe?id=${otherId}&t=${token}`, { method: 'POST' });
    expect(wrong.status).toBe(400);
    // One-click from a mail client (no Origin), or the page's button.
    const ok = await fetch(`${base}/api/waitlist/unsubscribe?id=${id}&t=${token}`, { method: 'POST' });
    expect(ok.status).toBe(200);
    expect(await ok.text()).toContain('unsubscribed');
    const byId = Object.fromEntries((await rows('waitlist')).map((r) => [r.id, r]));
    expect(byId[id]).toMatchObject({ unsubscribed: true });
    expect(byId[otherId]).toMatchObject({ unsubscribed: false });
    expect(handler.unsubscribeUrl('https://trykitted.com', SECRET, 'Sam.Rivera@example.com ')).toBe(
      `https://trykitted.com/api/waitlist/unsubscribe?id=${id}&t=${token}`,
    );
  });
});

describe('F13 delete', () => {
  it('removes the document, and a later signup starts fresh', async () => {
    await join();
    clockMs += 86_400_000;
    expect(await admin.deleteEmail(db, ' SAM.rivera@example.com')).toBe(true);
    expect(await rows('waitlist')).toHaveLength(0);
    expect(await admin.deleteEmail(db, 'sam.rivera@example.com')).toBe(false);
    await join({ src: 'ig' });
    expect((await rows('waitlist'))[0]).toMatchObject({ src: 'ig', day: '2026-10-21' });
  });
});

describe('F14 the form without JavaScript', () => {
  const form = (fields: Record<string, string>, o: PostOpts = {}) =>
    post('join', null, { ...o, type: 'application/x-www-form-urlencoded', raw: new URLSearchParams(fields).toString() });

  it('a plain form post is stored like the script\'s, and answers with a page', async () => {
    const r = await form({ email: 'Sam.Rivera@Example.com', platform: 'ios', adult: 'on', src: 'tiktok', device: 'iphone', website: '' });
    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toContain('text/html');
    expect(await r.text()).toContain('on the list.'); // the page writes the apostrophe as &#39;
    expect((await rows('waitlist'))[0]).toMatchObject({ email: 'sam.rivera@example.com', platform: 'ios', adult: true, src: 'tiktok' });
  });

  it('Android gets its own line; a missing answer gets a page that says what to fix', async () => {
    expect(await (await form({ email: 'a@b.co', platform: 'android', adult: 'on' })).text()).toContain('for Android');
    const r = await form({ email: 'c@d.co', platform: 'ios' });
    expect(r.status).toBe(400);
    expect(await r.text()).toContain('18 and up');
    const bad = await form({ email: 'nope', platform: 'ios', adult: 'on' });
    expect(bad.status).toBe(400);
    expect(await bad.text()).toContain('Check your email address.');
    expect(await rows('waitlist')).toHaveLength(1);
  });
});
