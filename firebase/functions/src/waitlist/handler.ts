// The landing page's waitlist (handoff/15-landing-page.md §4, checks F1–F12). Public, no sign-in: it takes an email,
// counts visits and signups, and handles unsubscribe links. It keeps no IP address (the rate limit uses a keyed hash
// with a daily salt), no cookie and nothing about the browser but one device word. Logs hold routes, statuses and
// timings only, never an email. Written against Node's request/response so the tests can run it in-process.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';

export interface WaitlistDeps {
  db: Firestore;
  /** Signs unsubscribe links and salts the rate limit's hash (Secret Manager: WAITLIST_SECRET). */
  secret(): string;
  /** The page's own origins; a POST from anywhere else is refused. */
  origins: string[];
  now(): number;
  log(entry: Record<string, unknown>): void;
}

export const SOURCES = ['tiktok', 'ig', 'snap', 'share', 'qr', 'direct'] as const;
export const DEVICES = ['iphone', 'android', 'desktop'] as const;
const PLATFORMS = ['ios', 'android'] as const;
const BODY_CAP = 2048;
const JOINS_PER_HOUR = 10;
const VISITS_PER_HOUR = 60;
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

const pick = <T extends string>(list: readonly T[], v: unknown, fallback: string): string =>
  typeof v === 'string' && (list as readonly string[]).includes(v) ? v : fallback;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
/** The document id: a hash of the normalized email, so the same email always lands on the same document. */
export const emailId = (email: string) => createHash('sha256').update(normalizeEmail(email)).digest('hex');
export const unsubscribeToken = (secret: string, id: string) =>
  createHmac('sha256', secret).update(`unsub:${id}`).digest('base64url').slice(0, 32);
export const unsubscribeUrl = (origin: string, secret: string, email: string) => {
  const id = emailId(email);
  return `${origin}/api/waitlist/unsubscribe?id=${id}&t=${unsubscribeToken(secret, id)}`;
};

/** New York's calendar day, YYYY-MM-DD (when the founder posts). */
export function nyDay(ms: number): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(ms));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** The lines a plain form post shows, the same words as the page's script (15 §3). */
const FORM_PROBLEMS: Record<string, string> = {
  email: 'Check your email address.',
  adult: 'Kitted is for ages 18 and up.',
  platform: 'Pick iPhone or Android.',
  rate: "That didn't go through. Try again in a few minutes.",
};

const isForm = (req: IncomingMessage) => (req.headers['content-type'] ?? '').startsWith('application/x-www-form-urlencoded');

const header = (req: IncomingMessage, name: string): string | undefined => {
  const v = req.headers[name];
  return Array.isArray(v) ? v[0] : v;
};
/** The visitor's address as Firebase Hosting forwards it; used only inside the hash below. */
const clientAddress = (req: IncomingMessage) =>
  (header(req, 'x-forwarded-for')?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown');

function send(res: ServerResponse, status: number, body?: Record<string, unknown>) {
  if (body === undefined) {
    res.writeHead(status, { 'cache-control': 'no-store' });
    res.end();
    return;
  }
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
function page(res: ServerResponse, status: number, title: string, line: string, form = '') {
  res.writeHead(status, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'",
  });
  res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)} · Kitted</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F3F4F6;color:#121628;font:17px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:16px}main{max-width:420px}h1{font-size:24px;margin:0 0 8px}p{color:#585E70;margin:0 0 20px}button{font:inherit;font-weight:600;background:#121628;color:#fff;border:0;border-radius:12px;padding:12px 20px;min-height:44px}a{color:#121628;font-weight:600}@media (prefers-color-scheme:dark){body{background:#0C0E14;color:#ECEEF3}p{color:#A1A7B5}button{background:#ECEEF3;color:#0C0E14}a{color:#ECEEF3}}</style></head><body><main><h1>${esc(title)}</h1><p>${esc(line)}</p>${form}<p><a href="/">Back to Kitted</a></p></main></body></html>`);
}

async function readBody(req: IncomingMessage & { rawBody?: Buffer }, cap: number): Promise<Buffer | null> {
  if (req.rawBody) return req.rawBody.length > cap ? null : req.rawBody; // Cloud Functions has already read it
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > cap) return null;
    chunks.push(c as Buffer);
  }
  return Buffer.concat(chunks);
}

export function createWaitlist(deps: WaitlistDeps) {
  const { db } = deps;

  /** One more try from this address in this hour; false when it's over the cap. The doc id is a keyed hash of the
   *  day and the address, so the address itself is never written and can't be recovered from it. */
  async function allow(req: IncomingMessage, kind: 'join' | 'visit', cap: number): Promise<boolean> {
    const now = deps.now();
    const hour = new Date(now).toISOString().slice(0, 13);
    const id = createHmac('sha256', deps.secret()).update(`${kind}:${hour.slice(0, 10)}:${clientAddress(req)}`).digest('hex').slice(0, 40);
    const ref = db.doc(`waitlist_rate/${id}`);
    return db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const d = snap.data() as { hour?: string; count?: number } | undefined;
      const count = d?.hour === hour ? (d.count ?? 0) : 0;
      if (count >= cap) return false;
      tx.set(ref, { hour, count: count + 1, at: now });
      return true;
    });
  }

  const bump = (fields: Record<string, number>) =>
    db.doc(`waitlist_stats/${nyDay(deps.now())}`).set(
      Object.fromEntries(Object.entries(fields).map(([k, n]) => [k, FieldValue.increment(n)])),
      { merge: true },
    );

  async function parse(req: IncomingMessage): Promise<Record<string, unknown> | 'big' | 'bad'> {
    const raw = await readBody(req, BODY_CAP);
    if (!raw) return 'big';
    if (isForm(req)) {
      const f = Object.fromEntries(new URLSearchParams(raw.toString('utf8')));
      return { ...f, adult: f.adult === 'on' || f.adult === 'true' };
    }
    try {
      const v = JSON.parse(raw.toString('utf8')) as unknown;
      return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : 'bad';
    } catch {
      return 'bad';
    }
  }

  /** The page's script answers in JSON; a plain form post (JavaScript off or not loaded yet, F14) gets a page. */
  function answer(req: IncomingMessage, res: ServerResponse, status: number, body: Record<string, unknown>, platform?: string): number {
    if (!isForm(req)) return (send(res, status, body), status);
    if (status === 200) {
      if (platform === 'android') page(res, 200, "You're on the list for Android.", "We'll email you when it's ready.");
      else page(res, 200, "You're on the list.", 'Invites go out in small batches. Watch for an email from Kitted.');
      return 200;
    }
    const line = FORM_PROBLEMS[String(body.error)] ?? "That didn't go through. Try again.";
    page(res, status, "Almost.", line);
    return status;
  }

  async function join(req: IncomingMessage, res: ServerResponse): Promise<number> {
    const body = await parse(req);
    if (body === 'big') return answer(req, res, 413, { error: 'body' });
    if (body === 'bad') return answer(req, res, 400, { error: 'body' });
    if (!(await allow(req, 'join', JOINS_PER_HOUR))) return answer(req, res, 429, { error: 'rate' });
    // The trap field: people never see it, bots fill it in. They're told it worked.
    if (typeof body.website === 'string' && body.website !== '') return answer(req, res, 200, { ok: true });

    const email = typeof body.email === 'string' ? normalizeEmail(body.email) : '';
    if (email.length > 254 || !EMAIL.test(email)) return answer(req, res, 400, { error: 'email' });
    if (body.adult !== true) return answer(req, res, 400, { error: 'adult' });
    if (!(PLATFORMS as readonly unknown[]).includes(body.platform)) return answer(req, res, 400, { error: 'platform' });
    const platform = body.platform as string;
    const src = pick(SOURCES, body.src, 'other');
    const device = pick(DEVICES, body.device, 'other');

    const now = deps.now();
    const ref = db.doc(`waitlist/${emailId(email)}`);
    const created = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists) {
        tx.update(ref, { platform, unsubscribed: false, updatedAt: now });
        return false;
      }
      tx.set(ref, { email, platform, adult: true, src, device, day: nyDay(now), createdAt: now, updatedAt: now, batch: null, invitedAt: null, unsubscribed: false });
      return true;
    });
    if (created) await bump({ [`signups_${src}`]: 1, [`signups_device_${device}`]: 1, [`signups_platform_${platform}`]: 1 });
    // The same answer either way: the page never tells anyone whether an email was already on the list.
    return answer(req, res, 200, { ok: true }, platform);
  }

  async function visit(req: IncomingMessage, res: ServerResponse): Promise<number> {
    const body = await parse(req);
    if (typeof body === 'object' && (await allow(req, 'visit', VISITS_PER_HOUR))) {
      const src = pick(SOURCES, body.src, 'other');
      const device = pick(DEVICES, body.device, 'other');
      await bump({ [`visits_${src}`]: 1, [`visits_device_${device}`]: 1 });
    }
    send(res, 204);
    return 204;
  }

  async function unsubscribe(req: IncomingMessage, res: ServerResponse, url: URL): Promise<number> {
    const id = url.searchParams.get('id') ?? '';
    const t = url.searchParams.get('t') ?? '';
    const want = Buffer.from(unsubscribeToken(deps.secret(), id));
    const got = Buffer.from(t);
    if (!/^[0-9a-f]{64}$/.test(id) || got.length !== want.length || !timingSafeEqual(got, want)) {
      page(res, 400, "That link didn't work.", 'Use the unsubscribe link in the newest email from Kitted.');
      return 400;
    }
    if (req.method === 'GET') {
      // A page with a button, so a mail app opening links ahead of time can't unsubscribe anyone.
      page(res, 200, 'Unsubscribe from Kitted emails?', "You won't get beta invites or launch news.",
        `<form method="post" action="/api/waitlist/unsubscribe?id=${esc(id)}&amp;t=${esc(t)}"><button type="submit">Unsubscribe</button></form>`);
      return 200;
    }
    const ref = db.doc(`waitlist/${id}`);
    const snap = await ref.get();
    if (snap.exists) await ref.update({ unsubscribed: true, updatedAt: deps.now() });
    page(res, 200, "You're unsubscribed.", "You won't get more emails from Kitted. Changed your mind? Join again on the home page.");
    return 200;
  }

  return async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const t0 = deps.now();
    const url = new URL(req.url ?? '/', 'http://local');
    const at = url.pathname.indexOf('/waitlist/');
    const route = at >= 0 ? url.pathname.slice(at + '/waitlist/'.length) : '';
    let status: number;
    if (route === 'unsubscribe') {
      status = req.method === 'GET' || req.method === 'POST' ? await unsubscribe(req, res, url) : (send(res, 405, { error: 'method' }), 405);
    } else if (route !== 'join' && route !== 'visit') {
      status = (send(res, 404, { error: 'notFound' }), 404);
    } else if (req.method !== 'POST') {
      status = (send(res, 405, { error: 'method' }), 405);
    } else if (!deps.origins.includes(header(req, 'origin') ?? '')) {
      status = (send(res, 403, { error: 'origin' }), 403);
    } else {
      status = route === 'join' ? await join(req, res) : await visit(req, res);
    }
    deps.log({ route, status, ms: deps.now() - t0 });
  };
}
