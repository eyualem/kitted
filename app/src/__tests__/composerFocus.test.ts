// 07 §18 (#315): the composer under VoiceOver (F1–F4) and the words kept when he leaves mid-dictation (L1–L4).
// VoiceOver itself can't be driven here or on the Simulator: the slots, the idle rule and the cursor moves are plain
// logic, and the capsule's drawing is read from the source (F2).
import { createDictationController, type DictationNative, type NativeDictationEvent } from '@/features/stylist/dictation';
import { composerSlots, cursorToField, goesIdle } from '@/features/stylist/composerSlots';
import { composerState } from '@/features/stylist/composerState';

declare const __dirname: string;
const { readFileSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');
const src = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');

const base = { recording: false, typing: false, hasText: false, micAvailable: true };

describe('F1 · one trailing control per state', () => {
  it('send with words, mic when empty, stop while he talks, nothing with no mic', () => {
    expect(composerSlots({ ...base, typing: true, hasText: true }).trail).toBe('send');
    expect(composerSlots({ ...base }).trail).toBe('mic');
    expect(composerSlots({ ...base, typing: true }).trail).toBe('mic');
    expect(composerSlots({ ...base, recording: true }).trail).toBe('stop');
    expect(composerSlots({ ...base, recording: true, hasText: true, typing: true }).trail).toBe('stop');
    expect(composerSlots({ ...base, micAvailable: false }).trail).toBeNull();
    expect(composerSlots({ ...base, micAvailable: false, hasText: true, typing: true }).trail).toBe('send');
  });

  it('the leading slot: camera at rest, ✕ while he talks, nothing while he types', () => {
    expect(composerSlots(base).lead).toBe('camera');
    expect(composerSlots({ ...base, recording: true }).lead).toBe('cancel');
    expect(composerSlots({ ...base, typing: true }).lead).toBeNull();
    expect(composerSlots({ ...base, typing: true, hasText: true }).lead).toBeNull();
  });
});

describe('F2 · the capsule keeps its slots as fixed, keyed children', () => {
  const c = src('features/stylist/Composer.tsx');
  const slots = c.slice(c.indexOf('const leadButton'), c.indexOf('function useScreenReader'));
  const capsule = slots.slice(slots.indexOf('styles.capsule'));

  it('every lead is key "lead", every trail key "trail", the middle "field" or "voice"', () => {
    expect(slots.match(/<Circle key="lead"/g)).toHaveLength(2);
    expect(slots.match(/<Circle key="trail"/g)).toHaveLength(3);
    expect(slots.match(/<Circle (?!key=)/g)).toBeNull();
    for (const k of ['key="field"', 'key="voice"']) expect(capsule).toContain(k);
  });

  it('the capsule draws {leadButton}, the middle, {trailButton}: no fragment per state', () => {
    expect(capsule).not.toMatch(/<>/);
    expect(capsule.indexOf('{leadButton}')).toBeLessThan(capsule.indexOf('key="field"'));
    expect(capsule.indexOf('{trailButton}')).toBeGreaterThan(capsule.indexOf('key="field"'));
    expect(c).toContain('composerSlots({ recording, typing');
  });
});

describe('F3 · with VoiceOver on, it never closes itself', () => {
  const after = { used: true, stopping: false, focused: false, recording: false, empty: true };
  it('VoiceOver off: empty, unfocused and quiet → back to the bar (as before)', () => {
    expect(goesIdle({ ...after, screenReader: false })).toBe(true);
    expect(goesIdle({ ...after, screenReader: false, focused: true })).toBe(false);
    expect(goesIdle({ ...after, screenReader: false, stopping: true })).toBe(false);
    expect(goesIdle({ ...after, screenReader: false, empty: false })).toBe(false);
    expect(goesIdle({ ...after, screenReader: false, used: false })).toBe(false);
  });

  it('VoiceOver on: a send, a ✕ or a stop with no words leaves it open', () => {
    expect(goesIdle({ ...after, screenReader: true })).toBe(false);
  });

  it('the escape gesture closes it; leaving the tab still does; the stop path uses the same rule', () => {
    const c = src('features/stylist/Composer.tsx');
    expect(c).toContain('onAccessibilityEscape');
    expect(c.match(/goesIdle\(/g)?.length).toBeGreaterThanOrEqual(2);
    expect(src('features/stylist/StylistScreen.tsx')).toMatch(/useFocusEffect\(useCallback\(\(\) => \(\) => composerState\.close\(\)/);
  });
});

describe('F4 · where the pressed control goes, the cursor goes to the field', () => {
  it('after ✕, always; after a send, only when no trailing button is left; after ■, never', () => {
    expect(cursorToField('cancel', 'mic')).toBe(true);
    expect(cursorToField('cancel', 'send')).toBe(true);
    expect(cursorToField('send', 'mic')).toBe(false);
    expect(cursorToField('send', null)).toBe(true);
    expect(cursorToField('stop', 'send')).toBe(false);
  });

  it('the composer moves the cursor with a focus event on the field', () => {
    const c = src('features/stylist/Composer.tsx');
    expect(c).toMatch(/sendAccessibilityEvent\?\.\(field\.current, 'focus'\)/);
    expect(c.match(/cursorToField\(/g)?.length).toBeGreaterThanOrEqual(2);
  });
});

function rig(o: { stopText?: string | null; stopHangs?: boolean } = {}) {
  let listener: ((e: NativeDictationEvent) => void) | null = null;
  const calls: string[] = [];
  const heard: { text: string; how: string | undefined }[] = [];
  const toasts: string[] = [];
  let releaseStop: (v: string | null) => void = () => {};
  const native: DictationNative = {
    requestMicrophone: async () => 'granted',
    prepare: async () => 'ready',
    start: async () => {
      calls.push('start');
    },
    stop: () => {
      calls.push('stop');
      if (o.stopHangs) return new Promise((r) => (releaseStop = r));
      return Promise.resolve(o.stopText === undefined ? null : o.stopText);
    },
    onEvent: (cb) => {
      listener = cb;
      return () => (listener = null);
    },
  };
  const timers: (() => void)[] = [];
  const ctl = createDictationController({
    native, now: () => 0, setTimer: (fn) => timers.push(fn), clearTimer: () => {}, words: () => [],
    onHeard: (text, how) => heard.push({ text, how }), onToast: (k) => toasts.push(k), onMicOff: () => {},
  });
  const flush = () => new Promise((r) => setTimeout(r, 0));
  return { ctl, calls, heard, toasts, timers, flush, send: (e: NativeDictationEvent) => listener?.(e), releaseStop: (v: string | null) => releaseStop(v) };
}

describe('L1 · leaving while he talks keeps his words', () => {
  it('the native side\'s last words go to the draft, once, quietly', async () => {
    const r = rig({ stopText: 'what goes with my olive overshirt' });
    await r.ctl.start();
    r.send({ type: 'text', text: 'what goes with my', final: false });
    r.ctl.dispose();
    await r.flush();
    expect(r.heard).toEqual([{ text: 'what goes with my olive overshirt', how: 'left' }]);
    expect(r.calls).toEqual(['start', 'stop']);
  });

  it('an older build (no words back) keeps the live text', async () => {
    const r = rig({ stopText: null });
    await r.ctl.start();
    r.send({ type: 'text', text: 'should I tuck in my tee ', final: false });
    r.ctl.dispose();
    await r.flush();
    expect(r.heard).toEqual([{ text: 'should I tuck in my tee', how: 'left' }]);
  });

  it('nothing heard: nothing lands, no toast', async () => {
    const r = rig({ stopText: '' });
    await r.ctl.start();
    r.ctl.dispose();
    await r.flush();
    r.timers.forEach((f) => f());
    await r.flush();
    expect([r.heard, r.toasts]).toEqual([[], []]);
  });
});

describe('L2 · leaving while a stop is on its way keeps that stop\'s words', () => {
  it('once, quietly', async () => {
    const r = rig({ stopHangs: true });
    await r.ctl.start();
    r.send({ type: 'text', text: 'how long should my jeans be', final: false });
    const stopped = r.ctl.stop();
    r.ctl.dispose();
    r.releaseStop('how long should my jeans be');
    await stopped;
    await r.flush();
    expect(r.heard).toEqual([{ text: 'how long should my jeans be', how: 'left' }]);
  });
});

describe('L3 · nothing kept from a mic that never listened, nor after dispose', () => {
  it('dispose while getting ready: no start, no words, no toast (U4 holds)', async () => {
    let release: (v: 'ready') => void = () => {};
    const calls: string[] = [];
    const heard: string[] = [];
    const native: DictationNative = {
      requestMicrophone: async () => 'granted',
      prepare: () => new Promise((r) => (release = r)),
      start: async () => void calls.push('start'),
      stop: async () => (calls.push('stop'), 'ghost words'),
      onEvent: () => () => {},
    };
    const ctl = createDictationController({ native, now: () => 0, setTimer: () => 0, clearTimer: () => {}, words: () => [], onHeard: (h) => heard.push(h), onToast: () => {}, onMicOff: () => {} });
    const started = ctl.start();
    await new Promise((x) => setTimeout(x, 0));
    ctl.dispose();
    release('ready');
    await started;
    expect([calls, heard]).toEqual([[], []]);
  });

  it('idle: dispose hands nothing; a late event after dispose never lands', async () => {
    const r = rig({ stopText: 'what shoes' });
    r.ctl.dispose();
    r.send({ type: 'text', text: 'late', final: true });
    r.send({ type: 'end', error: null });
    await r.flush();
    expect([r.heard, r.calls]).toEqual([[], []]);
  });
});

describe('L4 · kept words join the draft', () => {
  afterEach(() => composerState.setDraft(''));
  it('after what he typed, with a space; nothing heard leaves it alone', () => {
    composerState.setDraft('');
    composerState.appendHeard('what goes with my olive overshirt');
    expect(composerState.draft()).toBe('what goes with my olive overshirt');
    composerState.setDraft('For a date:');
    composerState.appendHeard('what shoes');
    expect(composerState.draft()).toBe('For a date: what shoes');
    composerState.appendHeard('   ');
    expect(composerState.draft()).toBe('For a date: what shoes');
  });

  it('useDictation hands the controller\'s "left" through, and the composer keeps it quiet', () => {
    expect(src('features/stylist/useDictation.ts')).toMatch(/onHeard: \(h, how\) => heardRef\.current\(h, how\)/);
    const c = src('features/stylist/Composer.tsx');
    expect(c).toContain('composerState.appendHeard(heard)');
    expect(c).toMatch(/how !== 'left'/);
  });
});
