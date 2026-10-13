import { onChange } from '@/data/changes';
import { createMemoryStore } from '@/data/memoryStore';
import { MIGRATIONS } from '@/data/migrations';
import { SPECS, colName, decode, decodeRowSafely, encode, type TableName } from '@/data/tables';
import type { ChatMessage } from '@/data/types';

const msg = (id: string, createdAt: number): ChatMessage => ({
  id, createdAt, role: 'stylist', kind: 'text', text: 'Hi', cardType: null, fitCheckId: null, outfitId: null, itemId: null,
  chips: [], payload: { stamp: true },
});

describe('table specs vs migrations', () => {
  it('every spec column exists in the schema (V1 + V2)', () => {
    const sql = MIGRATIONS.flatMap((m) => m.statements).join('\n');
    for (const name of Object.keys(SPECS) as TableName[]) {
      const spec = SPECS[name];
      expect(sql).toContain(`CREATE TABLE IF NOT EXISTS ${spec.table} (`);
      for (const [field, f] of Object.entries(spec.fields)) {
        const col = colName(field, f as never);
        expect({ table: spec.table, col, found: new RegExp(`\\b${col}\\b`).test(sql) }).toEqual({ table: spec.table, col, found: true });
      }
    }
  });
  it('V2 adds fit_checks.details and readings.derived_from', () => {
    const v2 = MIGRATIONS.find((m) => m.version === 2)!.statements.join('\n');
    expect(v2).toContain('ALTER TABLE fit_checks ADD COLUMN details');
    expect(v2).toContain('ALTER TABLE readings ADD COLUMN derived_from');
  });
  it('encodes and decodes column values', () => {
    expect(decode('bool', encode('bool', true))).toBe(true);
    expect(decode('json', encode('json', { a: [1] }))).toEqual({ a: [1] });
    expect(encode('text', null)).toBeNull();
  });
  it('a damaged JSON column skips that row (logged once), never the whole list', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const fromRow = (r: Record<string, unknown>) => ({ id: String(r.id), chips: decode('json', r.chips) });
    const rows = [{ id: 'a', chips: '[]' }, { id: 'b', chips: '{oops' }, { id: 'c', chips: '[1]' }];
    const decoded = rows.map((r) => decodeRowSafely('chat_messages', r, fromRow, 'id')).filter((r) => r !== null);
    expect(decoded).toEqual([{ id: 'a', chips: [] }, { id: 'c', chips: [1] }]);
    expect(decodeRowSafely('chat_messages', rows[1]!, fromRow, 'id')).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

describe('memory store', () => {
  it('put, get, patch, all, delete, with copies in and out', async () => {
    const s = createMemoryStore();
    const m = msg('M1', 10);
    await s.chat.put(m);
    m.text = 'changed after put';
    expect((await s.chat.get('M1'))!.text).toBe('Hi');
    const got = (await s.chat.get('M1'))!;
    got.chips.push('x');
    expect((await s.chat.get('M1'))!.chips).toEqual([]);
    expect((await s.chat.patch('M1', { text: 'Yo' }))!.text).toBe('Yo');
    expect(await s.chat.patch('nope', { text: 'x' })).toBeNull();
    await s.chat.put(msg('M2', 20));
    expect((await s.chat.all()).map((r) => r.id).sort()).toEqual(['M1', 'M2']);
    await s.chat.delete('M1');
    expect(await s.chat.get('M1')).toBeNull();
  });
  it('emits changes per table and wipe clears everything', async () => {
    const s = createMemoryStore();
    const seen: string[] = [];
    const off = onChange(['chat'], () => seen.push('chat'));
    await s.chat.put(msg('M1', 1));
    await s.usage.put({ dayKey: '2026-10-22', checks: 1, rechecks: 0, questions: 0, items: 0 });
    expect(seen).toEqual(['chat']);
    await s.setKv('a', 'b');
    await s.wipe();
    expect(seen).toEqual(['chat', 'chat']);
    expect(await s.chat.all()).toEqual([]);
    expect(await s.getKv('a')).toBeNull();
    off();
  });
});
