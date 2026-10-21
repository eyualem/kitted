// One Gemini request, sent either straight to Google with the dev key or to our server's route (13-server.md §8, #328).
// The four callers (the scoring read, the second look, the closet call, the stylist) build the same request body
// either way and parse Gemini's own answer either way: the server relays Gemini's body and status on success. On a
// refusal it answers JSON `{ error }`, read here into `refusal` so a caller can tell the limit or the spending stop
// from a failure.

export const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export type AiRoute = 'read' | 'look' | 'closet' | 'ask';
/** The server's kinds: a snap is the shoe snap or the pants-and-shoes finish. */
export type ServerKind = 'full' | 'recheck' | 'snap';

/** Which check a photo call belongs to (X-Kitted-Check / X-Kitted-Kind). */
export interface CheckTag {
  checkId: string;
  kind: ServerKind;
}

export interface AiSend {
  route: AiRoute;
  model: string;
  stream: boolean;
  body: string;
  signal?: AbortSignal;
  /** Photo routes: the check the call belongs to (the server refuses a photo call without one). */
  tag?: CheckTag;
  /** A tap answer to the stylist's own question: free up to 10 a day (X-Kitted-Free: tap). */
  free?: 'tap';
}

export type Refusal = { error: string; which?: string; reason?: string; status?: number };

/** What the callers read: the fetch response's shape, plus the server's refusal when it said no. */
export interface AiResponse {
  ok: boolean;
  status: number;
  body: { getReader(): { read(): Promise<{ done: boolean; value?: Uint8Array }>; cancel?(): Promise<void> } } | null;
  text(): Promise<string>;
  refusal?: Refusal;
}

/** The streaming fetch (expo/fetch on the phone); injected for tests. */
export type AiFetch = (url: string, init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal }) => Promise<{
  ok: boolean;
  status: number;
  body: AiResponse['body'];
  text(): Promise<string>;
  headers?: { get(name: string): string | null };
}>;

export interface AiTransport {
  readonly kind: 'direct' | 'server';
  send(req: AiSend): Promise<AiResponse>;
}

/** Straight to Gemini with the dev key (dev builds only): exactly the calls the app made before the server. */
export function directTransport(apiKey: string, fetch: AiFetch): AiTransport {
  return {
    kind: 'direct',
    send: (req) =>
      fetch(`${GEMINI_BASE}/${req.model}:${req.stream ? 'streamGenerateContent?alt=sse' : 'generateContent'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: req.body,
        signal: req.signal,
      }),
  };
}

/** The server's check id pattern (routes.ts CHECK_ID). */
export const CHECK_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/** Any app id as a server check id: other characters become "_", cut to 64. */
export const serverCheckId = (id: string): string => (id.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 64) || 'none');

/** A snap's own id on the server (A4): its read and its closet call share it, apart from the first check's. */
export const snapCheckId = (parentId: string): string => serverCheckId(`${serverCheckId(parentId).slice(0, 59)}-snap`);

/** The app's read kinds as the server's. */
export const serverKind = (kind: 'full' | 'recheck' | 'shoeSnap' | 'bottomSnap'): ServerKind =>
  kind === 'full' || kind === 'recheck' ? kind : 'snap';

/** The tag for one photo call of check `checkId` (snaps get their own id). */
export function checkTag(checkId: string, kind: 'full' | 'recheck' | 'shoeSnap' | 'bottomSnap'): CheckTag {
  const k = serverKind(kind);
  return { checkId: k === 'snap' ? snapCheckId(checkId) : serverCheckId(checkId), kind: k };
}

export class SignInError extends Error {
  constructor(readonly network: boolean, message = 'sign-in failed') {
    super(message);
  }
}

export interface ServerTransportOptions {
  base: string;
  fetch: AiFetch;
  /** The Firebase ID token; `force` asks for a fresh one (after a 401). Throws SignInError when there's none. */
  token: (force: boolean) => Promise<string>;
  /** Minutes east of UTC now (the server's 4 am day). */
  tzMinutes: () => number;
  /** The tier the server answered with (x-kitted-tier), on every success. */
  onTier?: (tier: 'free' | 'pro') => void;
}

function refused(status: number, refusal: Refusal, text = JSON.stringify(refusal)): AiResponse {
  return { ok: false, status, body: null, text: async () => text, refusal };
}

/** Our server: the same body to `<base>/v1/<route>?model=`, signed in, with the check's tags (13 §2, §8). */
export function serverTransport(o: ServerTransportOptions): AiTransport {
  async function once(req: AiSend, force: boolean): Promise<AiResponse> {
    let token: string;
    try {
      token = await o.token(force);
    } catch (e: unknown) {
      // No connection: the caller's offline path. Anything else (sign-in turned off, a bad config): a failure.
      if (e instanceof SignInError && e.network) throw e;
      return refused(401, { error: 'signIn' });
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Kitted-Tz': String(Math.round(o.tzMinutes())),
    };
    if (req.tag) {
      headers['X-Kitted-Check'] = req.tag.checkId;
      headers['X-Kitted-Kind'] = req.tag.kind;
    }
    if (req.free) headers['X-Kitted-Free'] = req.free;
    const res = await o.fetch(`${o.base}/v1/${req.route}?model=${encodeURIComponent(req.model)}`, { method: 'POST', headers, body: req.body, signal: req.signal });
    if (res.ok) {
      const tier = res.headers?.get('x-kitted-tier');
      if (tier === 'pro' || tier === 'free') o.onTier?.(tier);
      return res;
    }
    const text = await res.text().catch(() => '');
    let refusal: Refusal = { error: 'http' };
    try {
      const j = JSON.parse(text) as Refusal;
      if (j && typeof j.error === 'string') refusal = j;
    } catch {
      // not the server's JSON (a proxy's page): a plain failure
    }
    return refused(res.status, refusal, text);
  }
  return {
    kind: 'server',
    async send(req) {
      const r = await once(req, false);
      // An expired or revoked token: one fresh token and one more try (A6).
      if (r.status === 401 && r.refusal?.error === 'signIn' && !req.signal?.aborted) return once(req, true);
      return r;
    },
  };
}

/** What a caller does with a refusal: the limit card, the paused line, or its plain failure. */
export function refusalKind(res: Pick<AiResponse, 'refusal' | 'status'>): 'limit' | 'paused' | null {
  if (res.status === 429 && res.refusal?.error === 'limit') return 'limit';
  if (res.status === 503 && res.refusal?.error === 'paused') return 'paused';
  return null;
}
