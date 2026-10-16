// The composer's mic, as plain logic (round 2, #302; 07 §15.3, checks V1–V4). useDictation.ts wraps it for React.
//   start  · permission (the Settings alert when it's off) · the speech model ready (installs on first use, "Getting
//            voice ready…"; offline: "Voice needs a connection the first time.") · listen, with his piece names as
//            context words.
//   stop   · waits for the native side's last words and hands every word to onHeard (the field). A tap on stop, a
//            pause after he's talked (SILENCE_MS), or the minute cap all end the same way. Never sends anything.
//   cancel · drops the words.
// Events from an earlier session never refill the field (a late final after stop). Logs say counts, never words.

export type DictationState = 'idle' | 'preparing' | 'starting' | 'listening' | 'stopping';

export type NativeDictationEvent =
  | { type: 'text'; text: string; final: boolean }
  | { type: 'level'; level: number }
  | { type: 'end'; error: string | null }
  | { type: 'log'; line: string };

export interface DictationNative {
  requestMicrophone(): Promise<'granted' | 'denied'>;
  prepare(): Promise<'ready' | 'needsNetwork' | 'unsupported'>;
  start(words: readonly string[]): Promise<void>;
  /** The words heard, when the build hands them back; null on older builds (the live text is used). */
  stop(): Promise<string | null>;
  onEvent(cb: (e: NativeDictationEvent) => void): () => void;
}

export interface DictationDeps {
  native: DictationNative;
  now: () => number;
  setTimer: (fn: () => void, ms: number) => unknown;
  clearTimer: (id: unknown) => void;
  /** His closet's piece names (owned, one line each), for the context words. */
  words: () => readonly string[];
  onHeard: (text: string) => void;
  onToast: (key: 'mic.error' | 'mic.needsNetwork' | 'mic.noWords') => void;
  onMicOff: () => void;
  log?: (line: string) => void;
}

export interface DictationSnapshot {
  state: DictationState;
  text: string;
  level: number;
}

/** He can't talk forever into a chat box; stop after a minute. */
export const MAX_MS = 60_000;
/** A pause this long after words ends it, as if he'd tapped stop. */
export const SILENCE_MS = 1_600;
/** Nothing heard this long after it starts listening: "I didn't catch that." */
export const NO_WORDS_MS = 8_000;
/** A level at or above this counts as him talking (keeps the pause timer from firing mid-sentence). */
export const VOICE_LEVEL = 0.15;
export const MAX_WORDS = 100;

export function contextWords(names: readonly string[]): string[] {
  const out: string[] = [];
  for (const n of names) {
    const w = String(n).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
    if (w && !out.some((o) => o.toLowerCase() === w.toLowerCase())) out.push(w);
    if (out.length >= MAX_WORDS) break;
  }
  return out;
}

const count = (s: string) => s.split(/\s+/).filter(Boolean).length;

export function createDictationController(deps: DictationDeps) {
  const log = deps.log ?? (() => {});
  let state: DictationState = 'idle';
  let text = '';
  let level = 0;
  let session = 0;
  let startedAt = 0;
  let cap: unknown = null;
  let quiet: unknown = null;
  let nothing: unknown = null;
  const listeners = new Set<(s: DictationSnapshot) => void>();
  const emit = () => {
    const snap = { state, text, level };
    for (const l of listeners) l(snap);
  };
  const clear = (id: unknown) => {
    if (id !== null) deps.clearTimer(id);
  };
  const clearTimers = () => {
    clear(cap);
    clear(quiet);
    clear(nothing);
    cap = quiet = nothing = null;
  };
  const armQuiet = (s: number) => {
    clear(quiet);
    quiet = text.trim() ? deps.setTimer(() => {
      if (session === s && state === 'listening') {
        log('auto-stop · a pause');
        void finish(s);
      }
    }, SILENCE_MS) : null;
  };

  const off = deps.native.onEvent((e) => {
    if (e.type === 'log') return log(e.line);
    // Only the live session's events count: a late final after stop never refills the field.
    if (state !== 'starting' && state !== 'listening' && state !== 'stopping') return;
    const s = session;
    if (e.type === 'text') {
      const first = !text.trim() && !!e.text.trim();
      text = e.text;
      if (first) {
        log(`first words +${deps.now() - startedAt} ms`);
        clear(nothing);
        nothing = null;
      }
      if (state === 'listening') armQuiet(s);
      emit();
    } else if (e.type === 'level') {
      level = e.level;
      if (state === 'listening' && e.level >= VOICE_LEVEL && text.trim()) armQuiet(s);
      emit();
    } else if (e.type === 'end') {
      if (state === 'stopping') return; // our own stop: finish() handles it
      clearTimers();
      log(e.error ? 'ended · error' : 'ended');
      const heard = text.trim();
      state = 'idle';
      text = '';
      level = 0;
      // The words reach the field before the mic shows idle, so the composer never closes in between.
      if (!e.error && heard) deps.onHeard(heard);
      emit();
      if (e.error) deps.onToast('mic.error');
    }
  });

  async function finish(s: number): Promise<string> {
    if (session !== s || (state !== 'listening' && state !== 'starting')) return '';
    state = 'stopping';
    clearTimers();
    emit();
    log(`stop · ${count(text)} words so far`);
    let fin: string | null = null;
    try {
      fin = await deps.native.stop();
    } catch {
      fin = null;
    }
    if (session !== s) return '';
    const heard = (fin && fin.trim() ? fin : text).trim();
    log(`stopped +${deps.now() - startedAt} ms · ${count(heard)} words${fin === null ? ' (live text)' : ''}`);
    state = 'idle';
    text = '';
    level = 0;
    session++;
    // The words reach the field before the mic shows idle, so the composer never closes in between.
    if (heard) deps.onHeard(heard);
    emit();
    return heard;
  }

  return {
    get snapshot(): DictationSnapshot {
      return { state, text, level };
    },
    subscribe(fn: (s: DictationSnapshot) => void): () => void {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    async start(): Promise<void> {
      if (state !== 'idle') return;
      const s = ++session;
      startedAt = deps.now();
      if ((await deps.native.requestMicrophone()) !== 'granted') {
        log('permission · off');
        deps.onMicOff();
        return;
      }
      state = 'preparing';
      emit();
      const ready = await deps.native.prepare();
      if (session !== s) return;
      if (ready !== 'ready') {
        log(`model · ${ready}`);
        state = 'idle';
        emit();
        deps.onToast(ready === 'needsNetwork' ? 'mic.needsNetwork' : 'mic.error');
        return;
      }
      state = 'starting';
      text = '';
      emit();
      const words = contextWords(deps.words());
      try {
        await deps.native.start(words);
      } catch {
        if (session !== s) return;
        log('start · failed');
        state = 'idle';
        emit();
        deps.onToast('mic.error');
        return;
      }
      if (session !== s || state !== 'starting') return;
      state = 'listening';
      log(`listening +${deps.now() - startedAt} ms · ${words.length} context words`);
      emit();
      cap = deps.setTimer(() => {
        log('auto-stop · a minute');
        void finish(s);
      }, MAX_MS);
      if (!text.trim()) {
        nothing = deps.setTimer(() => {
          if (session !== s || state !== 'listening' || text.trim()) return;
          log('auto-stop · no words');
          void finish(s).then(() => deps.onToast('mic.noWords'));
        }, NO_WORDS_MS);
      } else armQuiet(s);
    },
    stop(): Promise<string> {
      return finish(session);
    },
    async cancel(): Promise<void> {
      if (state === 'idle') return;
      const was = state;
      session++;
      clearTimers();
      state = 'idle';
      text = '';
      level = 0;
      emit();
      log('cancelled');
      if (was !== 'preparing') await deps.native.stop().catch(() => null);
    },
    dispose() {
      clearTimers();
      off();
      listeners.clear();
      if (state !== 'idle') void deps.native.stop().catch(() => null);
    },
  };
}

export type DictationController = ReturnType<typeof createDictationController>;
