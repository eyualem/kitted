// Checks S1–S7 (handoff/11-firestore-schema.md §9): the schema map, the codec, what never leaves the phone.
import { US_EASTERN } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import { KV, type KittedStore } from '@/data/store';
import { SPECS, type TableName } from '@/data/tables';
import type { CorrectionRow, DailyIdeaRow, FactRow } from '@/data/types';
import { GOING_FOR_LAST_KV } from '@/features/fitcheck/service';
import { BASICS_KEY, LOOKS_KEY, OTHER_STYLE_KEY } from '@/features/onboarding/basics';
import { PENDING_DELETES_KV } from '@/features/closet/fileCleanup';
import { INBOX_KEY } from '@/features/scan/inbox';
import { FINISH_KEY, STARTER_MARKS_KEY } from '@/features/finish/service';
import { SEGMENT_KEY } from '@/features/closet/outfits';
import { WEATHER_PERMISSION_KV } from '@/services/weather';
import { dataToRow, rowToData } from '@/sync/codec';
import {
  KV_SYNCED, SYNCED_COLLECTIONS, SYNCED_TABLES, TABLE_POLICY, fileRefs, kvPolicy, syncedFilePath, tablePolicy, type SyncedTable,
} from '@/sync/schema';
import { FIT_SKIP_KEY } from '@/features/closet/fitDoubt';
import { FIT_LINE_KEY } from '@/features/closet/fitLine';
import { FIT_LOG_KEY } from '@/features/closet/fitLog';

const fs = jest.requireActual('fs') as {
  readFileSync(p: string, e: string): string;
  readdirSync(p: string): string[];
  statSync(p: string): { isDirectory(): boolean };
};
const { join } = jest.requireActual('path') as { join(...p: string[]): string };
const { readFileSync, readdirSync, statSync } = fs;
declare const __dirname: string;
const ROOT = join(__dirname, '..', '..', '..');

async function fullStore(): Promise<KittedStore> {
  const s = createMemoryStore();
  await loadScenario(s, seed, { scenario: 'full', zone: US_EASTERN });
  const fact: FactRow = { id: 'F-1', key: 'budget', value: 'under $60', source: 'told', createdAt: 1, isDeleted: false };
  const corr: CorrectionRow = {
    id: 'K-1', fitCheckId: 'x', kind: 'wrongDetail', field: 'color', oldValue: 'navy', newValue: 'black', userScore: null, scoreBefore: 7, scoreAfter: 7.5,
    sentAt: null, createdAt: 2,
  };
  const idea: DailyIdeaRow = {
    id: '2026-10-22|day', dayKey: '2026-10-22', slot: 'day', occasion: 'class', style: 'minimalist', outfitId: null, weather: { nowF: 46, highF: 63 } as never,
    messageId: null, state: 'idea', fitCheckId: null, createdAt: 3,
  };
  await s.facts.put(fact);
  await s.corrections.put(corr);
  await s.dailyIdeas.put(idea);
  const profile = await s.profile.get('me');
  await s.profile.put({ ...(profile ?? ({} as never)), id: 'me', birthYear: 2003, heightCm: 178, styles: [['minimal', 0.5], ['streetwear', 0.3]] as never });
  return s;
}

function hasNestedArray(v: unknown): boolean {
  if (Array.isArray(v)) return v.some((x) => Array.isArray(x) || hasNestedArray(x));
  if (v && typeof v === 'object') return Object.values(v as Record<string, unknown>).some(hasNestedArray);
  return false;
}

describe('S1 every synced table round-trips', () => {
  it('row → data → row is equal, minus the fields never sent', async () => {
    const s = await fullStore();
    for (const n of SYNCED_TABLES) {
      const rows = await (s[n] as unknown as { all(): Promise<object[]> }).all();
      expect({ table: n, rows: rows.length > 0 }).toEqual({ table: n, rows: true });
      const omit = tablePolicy(n).omit ?? {};
      for (const row of rows) {
        const back = dataToRow<Record<string, unknown>>(n, JSON.parse(JSON.stringify(rowToData(n, row))) as Record<string, unknown>, null);
        const want: Record<string, unknown> = {};
        for (const f of Object.keys(SPECS[n].fields)) want[f] = f in omit ? omit[f] : ((row as Record<string, unknown>)[f] ?? null);
        expect(back).toEqual(want);
      }
    }
  });
  it("keeps this phone's copy of a field it never sends", async () => {
    const s = await fullStore();
    const me = (await s.profile.get('me'))!;
    const back = dataToRow('profile', rowToData('profile', { ...me, birthYear: 1990 }), me);
    expect(back.birthYear).toBe(2003);
  });
});

describe('S2 and S3 doc shape and size', () => {
  it('no undefined, no array in an array, ≤ 48 fields, every real row under 200 KB', async () => {
    const s = await fullStore();
    let largest = 0;
    for (const n of SYNCED_TABLES) {
      expect(Object.keys(SPECS[n].fields).length).toBeLessThanOrEqual(48);
      for (const row of await (s[n] as unknown as { all(): Promise<object[]> }).all()) {
        const data = rowToData(n, row);
        expect(Object.values(data).includes(undefined)).toBe(false);
        expect(hasNestedArray(data)).toBe(false);
        largest = Math.max(largest, JSON.stringify(data).length);
      }
    }
    expect(largest).toBeLessThan(200_000);
  });
});

describe('S4 never sent', () => {
  it('no birth year, no absolute file paths', async () => {
    const s = await fullStore();
    for (const n of SYNCED_TABLES) {
      for (const row of await (s[n] as unknown as { all(): Promise<object[]> }).all()) {
        const json = JSON.stringify(rowToData(n, row));
        expect(json).not.toContain('birthYear');
        expect(json).not.toContain('demoPhotoId');
      }
    }
    const out = KV_SYNCED[BASICS_KEY]!.outgoing!(JSON.stringify({ heightIn: 70, build: 'slim', fit: null, birthYear: 2003 }));
    expect(JSON.parse(out)).toEqual({ heightIn: 70, build: 'slim', fit: null });
    const back = KV_SYNCED[BASICS_KEY]!.incoming!(out, JSON.stringify({ birthYear: 2001 }));
    expect(JSON.parse(back)).toEqual({ heightIn: 70, build: 'slim', fit: null, birthYear: 2001 });
  });
  it('backs up only his kept photos, thumbs, cut-outs and scans, never send copies or caches', () => {
    expect(syncedFilePath('photos/abc-photo.jpg')).toBe('photos/abc-photo.jpg');
    expect(syncedFilePath('closet/abc-top.png')).toBe('closet/abc-top.png');
    expect(syncedFilePath('file:///var/mobile/Containers/Data/Application/X/Documents/photos/abc-thumb.jpg')).toBe('photos/abc-thumb.jpg');
    expect(syncedFilePath('scans/abc-send.jpg')).toBeNull();
    expect(syncedFilePath('upload/abc.jpg')).toBeNull();
    expect(syncedFilePath('file:///x/Library/Caches/detail/abc.jpg')).toBeNull();
    expect(syncedFilePath('photos/deep/abc.jpg')).toBeNull();
    expect(syncedFilePath('https://example.com/photos/a.jpg')).toBeNull();
    expect(fileRefs({ photoFile: 'photos/a-photo.jpg', details: { crops: ['closet/a-top.png'] }, raw: '{"keptPath":"scans/b-photo.jpg","sendPath":"scans/b-send.jpg"}' }))
      .toEqual(['closet/a-top.png', 'photos/a-photo.jpg', 'scans/b-photo.jpg']);
  });
});

describe('S5 and S6 everything is classified', () => {
  it('every table is synced or local; usage and the sync bookkeeping stay local', () => {
    expect(Object.keys(TABLE_POLICY).sort()).toEqual(Object.keys(SPECS).sort());
    expect(TABLE_POLICY.usage).toBe('local');
    expect(TABLE_POLICY.syncRows).toBe('local');
    expect(TABLE_POLICY.syncFiles).toBe('local');
  });
  it('every kv key the app writes is classified, and the literals match their modules', () => {
    const KNOWN: Record<string, string> = {
      LOOKS_KEY, OTHER_STYLE_KEY, BASICS_KEY, INBOX_KEY, GOING_FOR_LAST_KV, PENDING_DELETES_KV, WEATHER_PERMISSION_KV,
      PERMISSION_KV: WEATHER_PERMISSION_KV, MODE_KEY: 'camera.mode', REVEAL_KV: KV.revealFullShown,
      ACCOUNT_KEY: 'account.user', OFFER_KEY: 'account.offer', ONBOARDING_STEP_KEY: KV.onboardingStep,
      FINISH_KEY, STARTER_MARKS_KEY, SEGMENT_KEY, FIT_SKIP_KEY, FIT_LINE_KEY, FIT_LOG_KEY,
    };
    const resolve = (expr: string): string[] | null => {
      const e = expr.trim();
      const lit = /^['"`]([^'"`$]+)['"`]$/.exec(e);
      if (lit) return [lit[1]!];
      const kv = /^KV\.([a-zA-Z]+)$/.exec(e);
      if (kv) {
        // features/morning/service.ts has its own small KV (eveningIgnored, style).
        const v = (KV as Record<string, string>)[kv[1]!] ?? ({ eveningIgnored: 'idea.evening.ignored' } as Record<string, string>)[kv[1]!];
        return v === undefined ? null : [v];
      }
      if (/^KV\.style\(/.test(e)) return ['idea.style.day', 'idea.style.evening'];
      if (/^NOTIFY_KEY\[/.test(e)) return [KV.notifyIdea, KV.notifyReady, KV.notifyTrial];
      if (/^CURSOR_KV\(/.test(e)) return ['sync.cursor.x'];
      if (e === 'key' || e === 'k' || e === 'step.key') return []; // generic helpers (the store, the engine, demo steps, tests)
      return KNOWN[e] !== undefined ? [KNOWN[e]!] : null;
    };
    const files: string[] = [];
    const walk = (d: string) => {
      for (const f of readdirSync(d)) {
        const p = join(d, f);
        if (statSync(p).isDirectory()) {
          if (f !== '__tests__') walk(p);
        } else if (/\.tsx?$/.test(f)) files.push(p);
      }
    };
    walk(join(__dirname, '..'));
    const unclassified: string[] = [];
    let scanned = 0;
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/\.setKv\(\s*([^,]+),/g)) {
        scanned += 1;
        const keys = resolve(m[1]!);
        if (keys === null) unclassified.push(`${f}: ${m[1]}`);
        else for (const k of keys) if (kvPolicy(k) === null) unclassified.push(`${f}: ${k}`);
      }
    }
    expect(unclassified).toEqual([]);
    expect(scanned).toBeGreaterThan(20);
    for (const v of Object.values(KV)) expect({ key: v, classified: kvPolicy(v) !== null }).toEqual({ key: v, classified: true });
  });
});

describe('S7 names', () => {
  it('collections are valid, unique and match the rules and the server jobs', () => {
    expect(new Set(SYNCED_COLLECTIONS).size).toBe(SYNCED_COLLECTIONS.length);
    for (const c of SYNCED_COLLECTIONS) expect(c).toMatch(/^[a-zA-Z][a-zA-Z0-9]{0,63}$/);
    const rules = readFileSync(join(ROOT, 'firebase', 'firestore.rules'), 'utf8');
    const inRules = /coll in \[([^\]]+)\]/.exec(rules)![1]!.match(/'([^']+)'/g)!.map((x) => x.slice(1, -1));
    expect([...inRules].sort()).toEqual([...SYNCED_COLLECTIONS].sort());
    const fns = readFileSync(join(ROOT, 'firebase', 'functions', 'src', 'index.ts'), 'utf8');
    const inFns = /SYNCED_COLLECTIONS = \[([^\]]+)\]/.exec(fns)![1]!.match(/'([^']+)'/g)!.map((x) => x.slice(1, -1));
    expect([...inFns].sort()).toEqual([...SYNCED_COLLECTIONS].sort());
    const indexes = JSON.parse(readFileSync(join(ROOT, 'firebase', 'firestore.indexes.json'), 'utf8')) as { indexes: { collectionGroup: string }[] };
    expect(indexes.indexes.map((i) => i.collectionGroup).sort()).toEqual([...SYNCED_COLLECTIONS].sort());
  });
  it('every synced kv key is a valid document id', () => {
    for (const k of Object.keys(KV_SYNCED)) {
      expect(k).not.toContain('/');
      expect(k).not.toMatch(/^__.*__$/);
      expect(['.', '..']).not.toContain(k);
    }
  });
  it('the synced tables are exactly the policy', () => {
    const names = (Object.keys(TABLE_POLICY) as TableName[]).filter((n) => TABLE_POLICY[n] !== 'local');
    expect([...SYNCED_TABLES].sort()).toEqual(names.sort());
    for (const n of SYNCED_TABLES as SyncedTable[]) expect(tablePolicy(n).collection).toBeTruthy();
  });
});
