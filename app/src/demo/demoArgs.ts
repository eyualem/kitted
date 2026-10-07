// One parser for the demo keys (05 §5.2). Three sources, highest first:
//   deep-link / web query  >  iOS launch arguments (UserDefaults)  >  build defaults.
// Values arrive as strings (or numbers from UserDefaults); everything is validated here.

export type Seed = 'full' | 'empty';
export type Theme = 'light' | 'dark';

export interface DemoArgs {
  resetData: boolean;
  clearAge: boolean;
  seed: Seed | null;
  skipOnboarding: boolean;
  /** 1–20, or null. */
  demoScreen: number | null;
  /** Mock reading time in seconds, or 'real' (the photo's own latency). */
  latency: number | 'real';
  /** ISO local time (read in America/New_York when it has no offset), 'real', or null (scenario default). */
  now: string | 'real' | null;
  freeChecksUsed: number | null;
  pro: boolean;
  theme: Theme | null;
  uiTesting: boolean;
  /** Web only: fake iPhone 17 Pro safe areas. */
  frame: boolean;
}

export const DEFAULT_LATENCY_S = 6.6;

export const defaultDemoArgs: DemoArgs = {
  resetData: false,
  clearAge: false,
  seed: null,
  skipOnboarding: false,
  demoScreen: null,
  latency: DEFAULT_LATENCY_S,
  now: null,
  freeChecksUsed: null,
  pro: false,
  theme: null,
  uiTesting: false,
  frame: false,
};

/** Raw key → value pairs from one source. Keys use the deep-link names (no leading dash). */
export type RawArgs = Readonly<Record<string, unknown>>;

/** Launch-argument names that differ from the deep-link names. */
const LAUNCH_ALIASES: Readonly<Record<string, keyof DemoArgs>> = {
  demoLatency: 'latency',
  demoNow: 'now',
};

const ISO_LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;

function str(v: unknown): string | null {
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v === 'boolean') return v ? '1' : '0';
  return null;
}

function bool(v: unknown): boolean | null {
  const s = str(v);
  if (s === null) return null;
  if (s === '' || s === '1' || s.toLowerCase() === 'true' || s.toLowerCase() === 'yes') return true;
  if (s === '0' || s.toLowerCase() === 'false' || s.toLowerCase() === 'no') return false;
  return null;
}

function int(v: unknown, min: number, max: number): number | null {
  const s = str(v);
  if (s === null || !/^\d+$/.test(s)) return null;
  const n = Number(s);
  return n >= min && n <= max ? n : null;
}

/** Parses one source. Unknown keys and invalid values are ignored (never throw on input). */
export function parseArgs(raw: RawArgs): Partial<DemoArgs> {
  const out: Partial<DemoArgs> = {};
  for (const [rawKey, value] of Object.entries(raw)) {
    const key = (LAUNCH_ALIASES[rawKey] ?? rawKey) as keyof DemoArgs | string;
    switch (key) {
      case 'resetData':
      case 'clearAge':
      case 'skipOnboarding':
      case 'pro':
      case 'uiTesting':
      case 'frame': {
        const b = bool(value);
        if (b !== null) out[key] = b;
        break;
      }
      case 'seed': {
        const s = str(value);
        if (s === 'full' || s === 'empty') out.seed = s;
        break;
      }
      case 'demoScreen': {
        const n = int(value, 1, 20);
        if (n !== null) out.demoScreen = n;
        break;
      }
      case 'latency': {
        const s = str(value);
        if (s === 'real') out.latency = 'real';
        else if (s !== null && /^\d+(\.\d+)?$/.test(s) && Number(s) <= 60) out.latency = Number(s);
        break;
      }
      case 'now': {
        const s = str(value);
        if (s === 'real' || (s !== null && ISO_LOCAL.test(s))) out.now = s;
        break;
      }
      case 'freeChecksUsed': {
        const n = int(value, 0, 10);
        if (n !== null) out.freeChecksUsed = n;
        break;
      }
      case 'theme': {
        const s = str(value);
        if (s === 'light' || s === 'dark') out.theme = s;
        break;
      }
      default:
        break;
    }
  }
  return out;
}

/**
 * Merges the sources. `deepLink` wins over `launch`, which wins over the defaults.
 * `seed=full` implies skipOnboarding (05 §5.2).
 */
export function resolveDemoArgs(sources: { deepLink?: RawArgs; launch?: RawArgs; build?: Partial<DemoArgs> }): DemoArgs {
  const merged: DemoArgs = {
    ...defaultDemoArgs,
    ...(sources.build ?? {}),
    ...parseArgs(sources.launch ?? {}),
    ...parseArgs(sources.deepLink ?? {}),
  };
  if (merged.seed === 'full') merged.skipOnboarding = true;
  return merged;
}

/** Query string → RawArgs (works for `kitted://demo/...?a=1` and web URLs). */
export function queryToRaw(query: string): Record<string, string> {
  const q = query.startsWith('?') ? query.slice(1) : query;
  const out: Record<string, string> = {};
  if (!q) return out;
  for (const part of q.split('&')) {
    if (!part) continue;
    const eq = part.indexOf('=');
    const k = decodeURIComponent((eq < 0 ? part : part.slice(0, eq)).replace(/\+/g, ' '));
    const v = eq < 0 ? '' : decodeURIComponent(part.slice(eq + 1).replace(/\+/g, ' '));
    out[k] = v;
  }
  return out;
}

/** The demo keys the launch-argument reader looks up in UserDefaults. */
export const LAUNCH_ARG_KEYS = [
  'resetData',
  'clearAge',
  'seed',
  'skipOnboarding',
  'demoScreen',
  'demoLatency',
  'demoNow',
  'freeChecksUsed',
  'pro',
  'theme',
  'uiTesting',
] as const;
