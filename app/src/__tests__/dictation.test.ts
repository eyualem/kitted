// Round 2, V (07 §15.3): the composer's mic logic against a fake native side. The real transcription runs only on
// the phone (V7–V8) and the Mac bench (V6).
import { contextWords, createDictationController, MAX_MS, MAX_WORDS, NO_WORDS_MS, SILENCE_MS, type DictationNative, type NativeDictationEvent } from '@/features/stylist/dictation';

declare const __dirname: string;
const { readFileSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');

function rig(o: { permission?: 'granted' | 'denied'; prepare?: 'ready' | 'needsNetwork' | 'unsupported'; stopText?: string | null; stopDelayMs?: number } = {}) {
  let now = 0;
  const timers: { at: number; fn: () => void; id: number }[] = [];
  let nextId = 1;
  let listener: ((e: NativeDictationEvent) => void) | null = null;
  const calls: string[] = [];
  const heard: string[] = [];
  const toasts: string[] = [];
  let micOff = 0;
  let lastWords: readonly string[] = [];
  const native: DictationNative = {
    requestMicrophone: async () => o.permission ?? 'granted',
    prepare: async () => o.prepare ?? 'ready',
    start: async (w) => {
      calls.push('start');
      lastWords = w;
    },
    stop: async () => {
      calls.push('stop');
      // The native side's last final can arrive while stop is waiting (the old bug's window).
      if (o.stopDelayMs) listener?.({ type: 'text', text: 'what goes with my olive overshirt', final: true });
      return o.stopText === undefined ? null : o.stopText;
    },
    onEvent: (cb) => {
      listener = cb;
      return () => (listener = null);
    },
  };
  const ctl = createDictationController({
    native,
    now: () => now,
    setTimer: (fn, ms) => {
      const id = nextId++;
      timers.push({ at: now + ms, fn, id });
      return id;
    },
    clearTimer: (id) => {
      const i = timers.findIndex((t) => t.id === id);
      if (i >= 0) timers.splice(i, 1);
    },
    words: () => ['Olive overshirt', 'Khaki chinos', 'olive overshirt', 'Black Chelsea boots'],
    onHeard: (h) => heard.push(h),
    onToast: (k) => toasts.push(k),
    onMicOff: () => micOff++,
  });
  const advance = async (ms: number) => {
    const end = now + ms;
    for (;;) {
      timers.sort((a, b) => a.at - b.at);
      const t = timers[0];
      if (!t || t.at > end) break;
      timers.shift();
      now = t.at;
      t.fn();
      await flush();
    }
    now = end;
  };
  const flush = () => new Promise((r) => setTimeout(r, 0));
  const send = (e: NativeDictationEvent) => listener?.(e);
  return { ctl, send, advance, flush, calls, heard, toasts, get micOff() { return micOff; }, get words() { return lastWords; } };
}

describe('V1 · start, stop, cancel', () => {
  it('start → listening; stop hands every word to the field once', async () => {
    const r = rig({ stopText: 'what goes with my olive overshirt' });
    await r.ctl.start();
    expect(r.ctl.snapshot.state).toBe('listening');
    r.send({ type: 'text', text: 'what goes with my', final: false });
    expect(r.ctl.snapshot.text).toBe('what goes with my');
    const out = await r.ctl.stop();
    expect(out).toBe('what goes with my olive overshirt');
    expect(r.heard).toEqual(['what goes with my olive overshirt']);
    expect(r.ctl.snapshot).toEqual({ state: 'idle', text: '', level: 0 });
  });

  it('a final that lands while stop waits still reaches the field (the "empty after stop" bug)', async () => {
    const r = rig({ stopText: null, stopDelayMs: 300 });
    await r.ctl.start();
    r.send({ type: 'text', text: 'what goes with', final: false });
    await r.ctl.stop();
    expect(r.heard).toEqual(['what goes with my olive overshirt']);
  });

  it('an older build (no words back) uses the live text', async () => {
    const r = rig({ stopText: null });
    await r.ctl.start();
    r.send({ type: 'text', text: 'can I wear boots', final: false });
    expect(await r.ctl.stop()).toBe('can I wear boots');
  });

  it('cancel drops the words; a late event after stop or cancel never refills the field', async () => {
    const r = rig({ stopText: 'hello there' });
    await r.ctl.start();
    r.send({ type: 'text', text: 'hello', final: false });
    await r.ctl.cancel();
    expect(r.heard).toEqual([]);
    r.send({ type: 'text', text: 'hello there', final: true });
    r.send({ type: 'end', error: null });
    expect(r.ctl.snapshot.text).toBe('');
    expect(r.heard).toEqual([]);
    await r.ctl.start();
    r.send({ type: 'text', text: 'second try', final: false });
    await r.ctl.stop();
    r.send({ type: 'text', text: 'late words', final: true });
    expect(r.ctl.snapshot.text).toBe('');
    expect(r.heard).toEqual(['hello there']);
  });

  it('an error ends it with the toast and no words', async () => {
    const r = rig();
    await r.ctl.start();
    r.send({ type: 'text', text: 'half a', final: false });
    r.send({ type: 'end', error: 'boom' });
    expect(r.ctl.snapshot.state).toBe('idle');
    expect(r.toasts).toEqual(['mic.error']);
    expect(r.heard).toEqual([]);
  });

  it('permission off → the Settings alert, nothing starts', async () => {
    const r = rig({ permission: 'denied' });
    await r.ctl.start();
    expect(r.micOff).toBe(1);
    expect(r.calls).toEqual([]);
    expect(r.ctl.snapshot.state).toBe('idle');
  });

  it('the speech model: offline says so; unsupported is the plain error', async () => {
    const a = rig({ prepare: 'needsNetwork' });
    await a.ctl.start();
    expect([a.toasts, a.calls, a.ctl.snapshot.state]).toEqual([['mic.needsNetwork'], [], 'idle']);
    const b = rig({ prepare: 'unsupported' });
    await b.ctl.start();
    expect(b.toasts).toEqual(['mic.error']);
  });

  it('stops by itself after a minute, with the words', async () => {
    const r = rig({ stopText: 'a long ramble' });
    await r.ctl.start();
    r.send({ type: 'text', text: 'a long', final: false });
    for (let t = 0; t < MAX_MS; t += 1000) {
      r.send({ type: 'level', level: 0.5 }); // still talking: the pause timer keeps resetting
      await r.advance(1000);
    }
    expect(r.ctl.snapshot.state).toBe('idle');
    expect(r.heard).toEqual(['a long ramble']);
  });
});

describe('V2 · a pause ends it', () => {
  it(`${SILENCE_MS} ms of quiet after words stops it and fills the field`, async () => {
    const r = rig({ stopText: 'should I tuck my tee' });
    await r.ctl.start();
    r.send({ type: 'text', text: 'should I tuck', final: false });
    await r.advance(SILENCE_MS - 100);
    expect(r.ctl.snapshot.state).toBe('listening');
    r.send({ type: 'text', text: 'should I tuck my tee', final: false }); // a word resets it
    await r.advance(SILENCE_MS - 100);
    expect(r.ctl.snapshot.state).toBe('listening');
    r.send({ type: 'level', level: 0.4 }); // loud: still talking
    await r.advance(SILENCE_MS - 100);
    expect(r.ctl.snapshot.state).toBe('listening');
    r.send({ type: 'level', level: 0.02 }); // quiet doesn't reset
    await r.advance(200);
    await r.flush();
    expect(r.ctl.snapshot.state).toBe('idle');
    expect(r.heard).toEqual(['should I tuck my tee']);
  });

  it(`no words in ${NO_WORDS_MS / 1000} s → "I didn't catch that." and idle; quiet before any words never stops it early`, async () => {
    const r = rig({ stopText: '' });
    await r.ctl.start();
    await r.advance(NO_WORDS_MS - 100);
    expect(r.ctl.snapshot.state).toBe('listening');
    await r.advance(200);
    await r.flush();
    expect(r.ctl.snapshot.state).toBe('idle');
    expect(r.toasts).toEqual(['mic.noWords']);
    expect(r.heard).toEqual([]);
  });
});

describe('V3 · nothing is sent by itself', () => {
  it('the controller only hands words to the field; the composer shows them in full', () => {
    const composer = readFileSync(join(__dirname, '../features/stylist/Composer.tsx'), 'utf8');
    expect(composer).not.toMatch(/slice\(-33\)/);
    expect(composer).toMatch(/numberOfLines=\{4\}/);
    const hook = readFileSync(join(__dirname, '../features/stylist/useDictation.ts'), 'utf8');
    expect(hook).not.toMatch(/onSend|sendQuestion|askQuestion/);
  });
});

describe('V4 · context words', () => {
  it('his piece names, one line each, no repeats, capped', async () => {
    const r = rig();
    await r.ctl.start();
    expect(r.words).toEqual(['Olive overshirt', 'Khaki chinos', 'Black Chelsea boots']);
    expect(contextWords(['a\nb', '  x  ', ''])).toEqual(['a b', 'x']);
    expect(contextWords(Array.from({ length: 300 }, (_, i) => `piece ${i}`))).toHaveLength(MAX_WORDS);
  });
});

describe('V5 · the voice stays on the phone', () => {
  it('only the on-device transcriber, and no audio file', () => {
    const swift = readFileSync(join(__dirname, '../../modules/kitted-vision/ios/KittedDictation.swift'), 'utf8');
    const code = swift.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
    expect(code).toMatch(/DictationTranscriber/);
    expect(code).not.toMatch(/SFSpeechRecognizer|AVAudioRecorder|AVAudioFile|write\(to:/);
  });
});
