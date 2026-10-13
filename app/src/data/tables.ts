// One description per table: which row field maps to which SQLite column and how it's encoded.
// Both stores (SQLite on device, memory on web and in Jest) are generated from these, so they
// can't drift. Columns default to the snake_case of the field name.

import type {
  ChatMessage, ClosetItemRow, ClosetObservationRow, CorrectionRow, DailyIdeaRow, FactRow, FitCheckRow, OutfitRow, ProfileRow, ReadingRow, UsageDay, WearLogRow,
} from './types';

export type ColType = 'text' | 'int' | 'real' | 'bool' | 'json';
type FieldSpec = ColType | readonly [ColType, string];

export interface TableSpec<T> {
  table: string;
  key: keyof T & string;
  fields: { readonly [K in keyof T & string]-?: FieldSpec };
}

export const snake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
export const colType = (f: FieldSpec): ColType => (typeof f === 'string' ? f : f[0]);
export const colName = (field: string, f: FieldSpec): string => (typeof f === 'string' ? snake(field) : f[1]);

/** A row ↔ SQLite value (booleans as 0/1, JSON as TEXT). */
export function encode(t: ColType, v: unknown): string | number | null {
  if (v === undefined || v === null) return null;
  switch (t) {
    case 'bool':
      return v ? 1 : 0;
    case 'json':
      return JSON.stringify(v);
    case 'int':
    case 'real':
      return typeof v === 'number' ? v : Number(v);
    default:
      return String(v);
  }
}

export function decode(t: ColType, v: unknown): unknown {
  if (v === undefined || v === null) return null;
  switch (t) {
    case 'bool':
      return v === 1 || v === true || v === '1';
    case 'json':
      return typeof v === 'string' ? (JSON.parse(v) as unknown) : v;
    case 'int':
    case 'real':
      return typeof v === 'number' ? v : Number(v);
    default:
      return String(v);
  }
}

const loggedBadRows = new Set<string>();

/** One stored row to its object, or null when it can't be decoded (a damaged JSON column): that row is skipped and
 *  logged once, so one bad record never blanks a whole list or tab. */
export function decodeRowSafely<T>(table: string, raw: Record<string, unknown>, fromRow: (r: Record<string, unknown>) => T, keyCol: string): T | null {
  try {
    return fromRow(raw);
  } catch (e: unknown) {
    const id = `${table}:${String(raw[keyCol])}`;
    if (!loggedBadRows.has(id)) {
      loggedBadRows.add(id);
      console.warn(`[store] skipped a damaged row ${id}`, e);
    }
    return null;
  }
}

/** The generic table both stores implement. Lists are small (tens to hundreds of rows). */
export interface Table<T> {
  get(key: string): Promise<T | null>;
  all(): Promise<T[]>;
  /** Insert or replace the whole row. */
  put(row: T): Promise<T>;
  /** Merge fields into an existing row; returns the new row (null if missing). */
  patch(key: string, patch: Partial<T>): Promise<T | null>;
  delete(key: string): Promise<void>;
}

export const chatSpec: TableSpec<ChatMessage> = {
  table: 'chat_messages',
  key: 'id',
  fields: {
    id: 'text', createdAt: 'int', role: 'text', kind: 'text', text: 'text', cardType: 'text', fitCheckId: 'text',
    outfitId: 'text', itemId: 'text', chips: 'json', payload: 'json',
  },
};

export const fitCheckSpec: TableSpec<FitCheckRow> = {
  table: 'fit_checks',
  key: 'id',
  fields: {
    id: 'text', createdAt: 'int', dayKey: 'text', photoFile: 'text', thumbFile: 'text', demoPhotoId: 'text', imageHash: 'text',
    occasion: 'text', style: 'text', status: 'text', isPartial: 'bool', notRated: 'json', score: 'real', rawScore: 'real', subscores: 'json',
    occasionAdj: 'real', rulesFired: 'json', credits: 'json', advice: 'json', fixes: 'json', explanation: 'text',
    rubricVersion: 'text', isFavorite: 'bool', snapState: 'text', recheckUsed: 'bool', isFirstCheck: 'bool', readingId: 'text',
    parentId: 'text', itemIds: 'json', details: 'json',
  },
};

export const readingSpec: TableSpec<ReadingRow> = {
  table: 'readings',
  key: 'id',
  fields: {
    id: 'text', imageHash: 'text', source: 'text', reading: ['json', 'reading_json'], model: 'text', promptVersion: 'text',
    schemaVersion: 'text', latencyMs: 'int', createdAt: 'int', derivedFrom: 'text',
  },
};

export const closetSpec: TableSpec<ClosetItemRow> = {
  table: 'closet_items',
  key: 'id',
  fields: {
    id: 'text', name: 'text', slot: 'text', garment: ['json', 'garment_json'], hex: 'text', confirmedFields: 'json',
    photoFile: 'text', demoPhotoId: 'text', isPhotographed: 'bool', source: 'text', starterId: 'text', wornCount: 'int',
    lastWornAt: 'int', addedAt: ['int', 'created_at'], isDeleted: 'bool',
    shade: 'text', profile: 'json', cropFile: 'text', cropScore: 'real', art: 'json', mergedInto: 'text', maybeSameAs: 'text', updatedAt: 'int',
  } as TableSpec<ClosetItemRow>['fields'],
};

export const closetObservationSpec: TableSpec<ClosetObservationRow> = {
  table: 'closet_observations',
  key: 'id',
  fields: {
    id: 'text', itemId: 'text', fitCheckId: 'text', readingId: 'text', closetReadingId: 'text', garmentIndex: 'int', origin: 'text',
    garment: ['json', 'garment_json'], closet: ['json', 'closet_json'], sampledHex: 'text', sampledL: 'real', cropFile: 'text',
    cropQuality: 'real', decision: 'text', identityScore: 'real', candidates: 'json', askItemId: 'text', answeredAt: 'int',
    userConfirmed: 'json', createdAt: 'int', isDeleted: 'bool',
  },
};

export const usageSpec: TableSpec<UsageDay> = {
  table: 'usage_days',
  key: 'dayKey',
  fields: { dayKey: 'text', checks: 'int', rechecks: 'int', questions: 'int', items: 'int' },
};

export const profileSpec: TableSpec<ProfileRow> = {
  table: 'profile',
  key: 'id',
  fields: {
    id: 'text', birthYear: 'int', heightCm: 'real', build: 'text', fitPreference: 'text', styles: 'json', boldness: 'text',
    budget: 'text', lastOccasion: 'text', consentVersion: 'text', consentAt: 'int', onboardingDone: 'bool', ideaTime: 'text',
    units: 'text', createdAt: 'int',
  },
};

export const correctionSpec: TableSpec<CorrectionRow> = {
  table: 'corrections',
  key: 'id',
  fields: {
    id: 'text', fitCheckId: 'text', kind: 'text', field: 'text', oldValue: 'text', newValue: 'text', userScore: 'real',
    scoreBefore: 'real', scoreAfter: 'real', sentAt: 'int', createdAt: 'int',
  },
};

export const outfitSpec: TableSpec<OutfitRow> = {
  table: 'outfits',
  key: 'id',
  fields: { id: 'text', itemIds: 'json', occasion: 'text', title: 'text', summary: 'text', details: 'json', source: 'text', isSaved: 'bool', createdAt: 'int' },
};

export const wearLogSpec: TableSpec<WearLogRow> = {
  table: 'wear_log',
  key: 'day',
  fields: { day: 'text', fitCheckId: 'text', outfitId: 'text', createdAt: 'int' },
};

export const factSpec: TableSpec<FactRow> = {
  table: 'facts',
  key: 'id',
  fields: { id: 'text', key: 'text', value: 'text', source: 'text', createdAt: 'int', isDeleted: 'bool' },
};

export const dailyIdeaSpec: TableSpec<DailyIdeaRow> = {
  table: 'daily_ideas',
  key: 'id',
  fields: {
    id: 'text', dayKey: 'text', slot: 'text', occasion: 'text', style: 'text', outfitId: 'text', weather: 'json', messageId: 'text',
    state: 'text', fitCheckId: 'text', createdAt: 'int',
  },
};

export const SPECS = {
  chat: chatSpec,
  fitChecks: fitCheckSpec,
  readings: readingSpec,
  closet: closetSpec,
  closetObs: closetObservationSpec,
  usage: usageSpec,
  profile: profileSpec,
  corrections: correctionSpec,
  outfits: outfitSpec,
  wearLog: wearLogSpec,
  facts: factSpec,
  dailyIdeas: dailyIdeaSpec,
} as const;

export type TableName = keyof typeof SPECS;
export type RowOf<N extends TableName> = (typeof SPECS)[N] extends TableSpec<infer T> ? T : never;
export type Tables = { [N in TableName]: Table<RowOf<N>> };
