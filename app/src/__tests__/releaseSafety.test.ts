// The release-safety batch (09 §20.7, #323): checks written before the code. A Release build ships no demo tools and no
// secret, no link reaches an unbuilt paywall, no canned demo reading merges into a real check, nothing says "Saved"
// or shows a switch that does nothing, and a missing record says so. Behaviour where it's pure; the wiring from source.
import { demoEnabled } from '@/demo/config';
import { createMemoryStore } from '@/data/memoryStore';
import { answerLine, answerWithUndo } from '@/features/closet/answerToast';
import { createAsk, QUESTION_MAX_CHARS } from '@/features/ask/pipeline';
import { createDemoSource } from '@/features/ask/source';
import { saveOutcome } from '@/features/scan/saveOutcome';
import { t } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import type { PreparedImage, ReadingEvent, ReadKind } from '@/services/readingSource/types';

declare const __dirname: string;
declare const require: (id: string) => unknown;

const { readFileSync, existsSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string; existsSync(p: string): boolean }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');

const SRC = join(__dirname, '..');
const src = (p: string) => readFileSync(join(SRC, p), 'utf8');

describe('R1 · a release build is safe', () => {
  it('R1.1 the demo tools follow the build unless KITTED_DEMO says otherwise', () => {
    expect(demoEnabled(null, true)).toBe(true); // Debug, unset: on (his phone, the Simulator, the web preview)
    expect(demoEnabled(null, false)).toBe(false); // Release, unset: off
    expect(demoEnabled(undefined, false)).toBe(false);
    expect(demoEnabled(true, false)).toBe(true); // KITTED_DEMO=1: the Maestro demo build
    expect(demoEnabled(false, true)).toBe(false); // KITTED_DEMO=0: off everywhere
    expect(src('demo/config.ts')).toMatch(/DEMO_ENABLED: boolean = demoEnabled\(Constants\.expoConfig\?\.extra\?\.demo, __DEV__\)/);
  });

  it('R1.1 app.config.ts: KITTED_DEMO=1 → true, 0 → false, unset → null (follow the build)', () => {
    const before = process.env.KITTED_DEMO;
    const demoFor = (v: string | undefined) => {
      if (v === undefined) delete process.env.KITTED_DEMO;
      else process.env.KITTED_DEMO = v;
      let out: unknown;
      jest.isolateModules(() => {
        out = (require('../../app.config') as { default: { extra: { demo: unknown } } }).default.extra.demo;
      });
      return out;
    };
    try {
      expect([demoFor('1'), demoFor('0'), demoFor(undefined)]).toEqual([true, false, null]);
    } finally {
      if (before === undefined) delete process.env.KITTED_DEMO;
      else process.env.KITTED_DEMO = before;
    }
  });

  describe('R1.2 guard:release', () => {
    const guard = require('../../scripts/guard-release.js') as {
      parseEnv(text: string): Record<string, string>;
      secretsFrom(envs: Record<string, string>[]): { secrets: Map<string, string>; allowed: Set<string> };
      scan(files: { path: string; text: string }[], s: { secrets: Map<string, string>; allowed: Set<string> }): string[];
    };
    const FIREBASE = `AIza${'F'.repeat(35)}`;
    const GEMINI = `AIza${'G'.repeat(35)}`;
    const OPENAI = `sk-proj-${'o'.repeat(40)}`;
    const env = guard.parseEnv(
      `EXPO_PUBLIC_GEMINI_DEV_KEY=${GEMINI}\n# a comment\n\nEXPO_PUBLIC_FIREBASE_API_KEY="${FIREBASE}"\nOPENAI_API_KEY=${OPENAI}\nSHORT=abc\n`,
    );
    const s = guard.secretsFrom([env]);

    it('is a package script', () => {
      expect((JSON.parse(readFileSync(join(SRC, '..', 'package.json'), 'utf8')) as { scripts: Record<string, string> }).scripts['guard:release']).toBe('node scripts/guard-release.js');
    });
    it('reads the env files: the Firebase key is allowed, every other long value is a secret', () => {
      expect(env.EXPO_PUBLIC_FIREBASE_API_KEY).toBe(FIREBASE);
      expect([...s.allowed]).toEqual([FIREBASE]);
      expect([...s.secrets.values()].sort()).toEqual(['EXPO_PUBLIC_GEMINI_DEV_KEY', 'OPENAI_API_KEY']);
    });
    it('passes a bundle with only the Firebase key', () => {
      expect(guard.scan([{ path: 'entry.hbc', text: `x${FIREBASE}y generativelanguage.googleapis.com` }], s)).toEqual([]);
    });
    it('fails on the Gemini key, any other Google key, and any sk- key', () => {
      expect(guard.scan([{ path: 'a.hbc', text: `..${GEMINI}..` }], s).join('\n')).toMatch(/EXPO_PUBLIC_GEMINI_DEV_KEY/);
      expect(guard.scan([{ path: 'a.hbc', text: `AIza${'Z'.repeat(35)}` }], s).join('\n')).toMatch(/isn't the Firebase web key/);
      expect(guard.scan([{ path: 'a.hbc', text: `sk-ant-${'a'.repeat(30)}` }], s).join('\n')).toMatch(/sk- key/);
      expect(guard.scan([{ path: 'a.hbc', text: OPENAI }], s).join('\n')).toMatch(/OPENAI_API_KEY/);
    });
    it('refuses a default config that turns the demo on, and exports with KITTED_DEMO unset', () => {
      const g = readFileSync(join(SRC, '..', 'scripts', 'guard-release.js'), 'utf8');
      expect(g).toMatch(/delete env\.KITTED_DEMO/);
      expect(g).toMatch(/if \(demo === true\)/);
      expect(g).toMatch(/'expo', 'export', '--platform', 'ios'/);
    });
  });
});

describe('R2 · the paywall route exists only while the paywall is on', () => {
  const layout = src('app/_layout.tsx');
  it('registered in its own group guarded by usePaywallOn()', () => {
    expect(layout).toMatch(/const paywall = usePaywallOn\(\);/);
    expect(layout).toMatch(/<Stack\.Protected guard=\{ready && !blocked && paywall\}>\s*<Stack\.Screen name="paywall" options=\{cover\} \/>\s*<\/Stack\.Protected>/);
    expect(layout.match(/name="paywall"/g)).toHaveLength(1);
  });
});

describe('R3 · no canned demo reading in a real check', () => {
  const real: PreparedImage = { sha256: 'not-a-demo-photo' } as PreparedImage;
  const sample: PreparedImage = { sha256: 'x', photoId: 'p01b' } as PreparedImage;
  const read = async (cannedSnaps: boolean | undefined, image: PreparedImage, kind: ReadKind) => {
    const source = createMockReadingSource({ latency: () => 0, ...(cannedSnaps === undefined ? {} : { cannedSnaps: () => cannedSnaps }) });
    const out: ReadingEvent[] = [];
    for await (const e of source.read(image, kind)) out.push(e);
    return out.at(-1);
  };
  it.each(['shoeSnap', 'bottomSnap'] as const)('a real photo\'s %s gets unknownPhoto, off a demo screen and by default', async (kind) => {
    expect(await read(false, real, kind)).toEqual({ type: 'failed', code: 'unknownPhoto', counted: false });
    expect(await read(undefined, real, kind)).toEqual({ type: 'failed', code: 'unknownPhoto', counted: false });
  });
  it.each(['shoeSnap', 'bottomSnap'] as const)('a bundled sample photo or a demo screen keeps the story\'s %s', async (kind) => {
    expect((await read(false, sample, kind))?.type).toBe('meta'); // …after its reading: a full replay
    expect((await read(true, real, kind))?.type).toBe('meta');
  });
  it('the app turns canned snaps on only on a demo screen', () => {
    expect(src('features/fitcheck/session.ts')).toMatch(/cannedSnaps: \(\) => DEMO_ENABLED && getDemoArgs\(\)\.demoScreen !== null/);
  });
});

describe('R4 · a failed scan never says "Saved"', () => {
  it('the count is the real count; none saved says so', () => {
    expect(saveOutcome(0, 1)).toEqual({ kind: 'notSaved', many: false });
    expect(saveOutcome(0, 3)).toEqual({ kind: 'notSaved', many: true });
    expect(saveOutcome(2, 3)).toEqual({ kind: 'saved', count: 2 });
    const scan = src('features/scan/ScanCameraScreen.tsx');
    expect(scan).not.toMatch(/Math\.max\(saved, 1\)/);
    expect(scan).toMatch(/saveOutcome\(saved, uris\.length\)/);
    expect(t('scan.notSaved.title')).toBe("Couldn't save that photo.");
  });
});

describe('R5 · Settings hides what does nothing', () => {
  it('Notifications only once they are built; Subscription and Restore only with the paywall', () => {
    const settings = src('app/(tabs)/you/settings.tsx');
    expect(settings).toMatch(/\{NOTIFICATIONS_BUILT \? <LinkRow title=\{t\('settings\.notifications'\)\}/);
    expect(settings).toMatch(/\{paywall \? \(\s*<Section label=\{t\('settings\.subscription'\)\}>/);
    const plan = src('app/(tabs)/you/plan.tsx');
    expect(plan).toMatch(/\{paywall \? \(\s*<Section>\s*<LinkRow title=\{t\('settings\.restore'\)\}/);
  });
});

describe('R6 · "Added to your closet" rows open the piece page', () => {
  it('no switch; a row closes the sheet and opens /closet/item/<id>', () => {
    const added = src('features/added/AddedSheet.tsx');
    expect(added).not.toMatch(/EDIT_ITEM_BUILT/);
    expect(added).toMatch(/function openPieceFromSheet\(id: string\) \{\s*router\.back\(\);\s*openPiece\(\{ id \}\);/);
    expect(added).toMatch(/onEdit=\{\(\) => openPieceFromSheet\(item\.id\)\}/);
    expect(added).toMatch(/onPress=\{removed \? undefined : onEdit\}/);
    expect(src('features/closet/pieceActions.ts')).toMatch(/router\.push\(`\/closet\/item\/\$\{item\.id\}`\)/);
  });
});

describe('R7 · a re-check whose first check is gone says so', () => {
  it('noParent has its own toast', () => {
    expect(src('features/camera/startCheck.ts')).toMatch(/r\.outcome === 'noParent'\) \{[^}]*showToast\(t\('cam\.noParent'\)\)/);
    expect(t('cam.noParent')).toBe("That check isn't here anymore. Nothing was sent or counted.");
  });
});

describe('R8 · a question has a length cap', () => {
  it('the field takes 500 characters at most', () => {
    expect(QUESTION_MAX_CHARS).toBe(500);
    expect(src('features/stylist/Composer.tsx')).toMatch(/maxLength=\{QUESTION_MAX_CHARS\}/);
  });
  it('the send path cuts a longer one (dictation) to 500', async () => {
    const store = createMemoryStore();
    const clock = manualClock(Date.parse('2026-10-22T12:30:00-04:00'));
    const ask = createAsk({
      store, quota: createQuota({ store, clock, isPro: () => true }), clock, ids: counterIds(),
      source: () => createDemoSource({ answers: [], scheduler: { sleep: async () => {} }, timed: () => false }),
      consent: async () => true, openConsent: () => {}, tryPro: () => false, log: () => {},
    });
    await ask.ask(`What goes with ${'my jeans '.repeat(80)}?`);
    const mine = (await store.chat.all()).filter((m) => m.role === 'user');
    expect(mine).toHaveLength(1);
    expect(mine[0]!.text!.length).toBeLessThanOrEqual(500);
    expect(mine[0]!.text!.startsWith('What goes with my jeans')).toBe(true);
  });
});

describe('R9 · Past chats are read-only', () => {
  it('the morning card gets readOnly; Staying in shows text, the checked row is no button', () => {
    expect(src('features/stylist/MessageView.tsx')).toMatch(/<MorningCard ideaId=\{m\.payload\.ideaId\} readOnly=\{readOnly\} \/>/);
    const card = src('features/morning/MorningCard.tsx');
    expect(card).toMatch(/onPress=\{messageId && !readOnly \? \(\) => setStylistAction/);
    expect(card).toMatch(/readOnly \? \(\s*<KText variant="subheadline" color="ink2">\s*\{occasion\}/);
  });
});

describe('R10 · a "Same as your …?" answer in Closet says so, with Undo', () => {
  const candidate = { name: 'Khaki chinos' };
  const runnerUp = { name: 'Brown chinos' };
  it('the line is the card\'s own', () => {
    expect(answerLine('same', candidate, runnerUp)).toBe('Saved as your khaki chinos.');
    expect(answerLine('runnerUp', candidate, runnerUp)).toBe('Saved as your brown chinos.');
    expect(answerLine('new', candidate, runnerUp)).toBe('Kept as a new piece.');
  });
  it('answer, toast, Undo un-answers; nothing said when the answer didn\'t land', async () => {
    const calls: string[] = [];
    let undo: (() => void) | null = null;
    const d = {
      answer: async (c: string, o: string, a: string) => (calls.push(`answer ${c} ${o} ${a}`), c === 'gone' ? null : { id: c }),
      unanswer: async (c: string, o: string) => void calls.push(`unanswer ${c} ${o}`),
      toast: (text: string, u: () => void) => {
        calls.push(`toast ${text}`);
        undo = u;
      },
    };
    await answerWithUndo(d, 'FC1', { obsId: 'O1' }, 'same', candidate, null);
    (undo as unknown as () => void)();
    await answerWithUndo(d, 'gone', { obsId: 'O2' }, 'new', candidate, null);
    expect(calls).toEqual(['answer FC1 O1 same', 'toast Saved as your khaki chinos.', 'unanswer FC1 O1', 'answer gone O2 new']);
    expect(src('app/(tabs)/closet/index.tsx')).toMatch(/onAnswer=\{\(a\) => void answerWithUndo\(answerDeps, checkId, ask, a, candidate, runnerUp\)\}/);
  });
});

describe('R11 · a missing record says "This isn\'t here anymore."', () => {
  it.each([
    ['features/lookbook/LookPageScreen.tsx', /if \(look === null\) return <GonePage \/>;/],
    ['features/closet/PiecePage.tsx', /data\.mergedInto \|\| leaving \? <ScrollView[^\n]*\/> : <GonePage \/>/],
    ['features/photoViewer/PhotoViewer.tsx', /if \(data === null\) \{\s*return \(\s*<GonePage>/],
    ['features/stylist/PastChats.tsx', /if \(loaded && !day\) return <GonePage \/>;/],
    ['features/why/WhySheet.tsx', /if \(data === null\) return <GoneSheet \/>;/],
    ['features/correct/CorrectSheet.tsx', /if \(data === null\) return <GoneSheet \/>;/],
    ['features/added/AddedSheet.tsx', /if \(data === null\) return <GoneSheet \/>;/],
    ['features/tellMe/TellMeSheet.tsx', /if \(data === null\) return <GoneSheet \/>;/],
    ['features/closet/EditSheet.tsx', /if \(data === null && !busy\) return <GoneSheet \/>;/],
    ['features/closet/MergeSheet.tsx', /if \(data === null && !busy\) return <GoneSheet \/>;/],
    ['app/sheets/fact/[id].tsx', /if \(!fact \|\| fact\.isDeleted\) return <GoneSheet \/>;/],
    ['features/pickShoes/PickShoesSheet.tsx', /if \(data === null\) return <GoneSheet \/>;/],
  ])('%s', (file, re) => {
    expect(src(file)).toMatch(re);
  });
  it('a bad link gets the same page with Go to Kitted', () => {
    expect(src('app/+not-found.tsx')).toMatch(/<GonePage>\s*<KButton title=\{t\('gone\.home'\)\}[^\n]*router\.replace\('\/'\)/);
    expect([t('gone.title'), t('gone.home')]).toEqual(["This isn't here anymore.", 'Go to Kitted']);
  });
});

describe('R12 · no placeholder route ships', () => {
  const layout = src('app/_layout.tsx');
  // sheets/swap/[ideaId] was a placeholder until S28 was built on it (#377, swapSheet.test.ts S6).
  it.each(['shoe-snap', 'sheets/describe', 'sheets/looks-by-name', 'sheets/rotation'])('%s is deleted and unregistered', (route) => {
    expect(existsSync(join(SRC, 'app', `${route}.tsx`))).toBe(false);
    expect(layout).not.toContain(`name="${route}"`);
  });
  it('share/[checkId] only behind its switch or the demo tools', () => {
    expect(layout).toMatch(/<Stack\.Protected guard=\{ready && !blocked && \(SHARE_CARD_BUILT \|\| DEMO_ENABLED\)\}>\s*<Stack\.Screen name="share\/\[checkId\]" options=\{cover\} \/>/);
  });
});
