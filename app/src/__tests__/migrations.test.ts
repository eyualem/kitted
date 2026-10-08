import { LATEST_VERSION, MIGRATIONS, TABLES, pendingMigrations } from '@/data/migrations';

describe('migrations', () => {
  it('starts at V1 with strictly increasing versions', () => {
    expect(MIGRATIONS[0]?.version).toBe(1);
    MIGRATIONS.forEach((m, i) => i > 0 && expect(m.version).toBeGreaterThan(MIGRATIONS[i - 1]!.version));
    expect(LATEST_VERSION).toBe(MIGRATIONS[MIGRATIONS.length - 1]!.version);
  });

  it('creates every table it can wipe', () => {
    const sql = MIGRATIONS.flatMap((m) => m.statements).join('\n');
    for (const table of TABLES) expect(sql).toContain(`CREATE TABLE IF NOT EXISTS ${table} (`);
  });

  it('has no UNIQUE constraints beyond primary keys (05 §3.2)', () => {
    const sql = MIGRATIONS.flatMap((m) => m.statements).join('\n');
    expect(sql).not.toMatch(/\bUNIQUE\b/i);
  });

  it('keeps styles an ordered JSON array and status as free text (held, ruling 27)', () => {
    const sql = MIGRATIONS.flatMap((m) => m.statements).join('\n');
    expect(sql).toContain("styles TEXT NOT NULL DEFAULT '[]'");
    expect(sql).toContain("status TEXT NOT NULL DEFAULT 'scoring'");
  });

  it('runs only newer migrations', () => {
    expect(pendingMigrations(0).map((m) => m.version)).toEqual(MIGRATIONS.map((m) => m.version));
    expect(pendingMigrations(LATEST_VERSION)).toEqual([]);
  });
});

// V5 runs on a real SQLite (Node's built-in one), from an empty file through every migration.
describe('V5 and V6 on a real SQLite', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: new (p: string) => { exec(s: string): void; prepare(s: string): { all(): Record<string, unknown>[] } } };
  const upTo = (v: number) => {
    const db = new DatabaseSync(':memory:');
    for (const m of MIGRATIONS.filter((x) => x.version <= v)) for (const s of m.statements) db.exec(s);
    return db;
  };

  it('rewrites checks, ideas, the remembered card style, re-scored details and his picks', () => {
    const db = upTo(4);
    db.exec(`INSERT INTO fit_checks (id, style, details) VALUES
      ('a', 'preppy', '{}'), ('b', 'old_money', '{"rescoredFrom":{"score":8,"occasion":"date","style":"gorpcore"}}'),
      ('c', 'gorpcore', '{}'), ('d', 'streetwear', '{"rescoredFrom":{"score":7,"occasion":"class","style":"old_money"}}'), ('e', NULL, '{}')`);
    db.exec(`INSERT INTO daily_ideas (id, style) VALUES ('x|day', 'old_money'), ('y|day', 'gorpcore'), ('z|day', NULL), ('w|day', 'minimalist')`);
    db.exec(`INSERT INTO kv (key, value) VALUES ('idea.style.day', 'preppy'), ('idea.style.evening', 'gorpcore'), ('occasion.last', 'date')`);
    db.exec(`INSERT INTO profile (id, styles) VALUES ('me', '[["preppy",0.5],["gorpcore",0.3],["streetwear",0.2]]')`);
    for (const s of MIGRATIONS.find((m) => m.version === 5)!.statements) db.exec(s);

    const rows = (sql: string) => db.prepare(sql).all();
    expect(rows('SELECT id, style, details FROM fit_checks ORDER BY id')).toEqual([
      { id: 'a', style: 'classic_prep', details: '{}' },
      { id: 'b', style: 'classic_prep', details: '{"rescoredFrom":{"score":8,"occasion":"date","style":"outdoor"}}' },
      { id: 'c', style: 'outdoor', details: '{}' },
      { id: 'd', style: 'streetwear', details: '{"rescoredFrom":{"score":7,"occasion":"class","style":"classic_prep"}}' },
      { id: 'e', style: null, details: '{}' },
    ]);
    expect(rows('SELECT id, style FROM daily_ideas ORDER BY id').map((r) => r.style)).toEqual(['minimalist', 'classic_prep', 'outdoor', null]);
    expect(rows('SELECT key, value FROM kv ORDER BY key')).toEqual([
      { key: 'idea.style.day', value: 'classic_prep' }, { key: 'idea.style.evening', value: 'outdoor' }, { key: 'occasion.last', value: 'date' },
    ]);
    // Order and weights stay (the label tie-break reads the order).
    expect(JSON.parse(String(rows("SELECT styles FROM profile WHERE id = 'me'")[0]!.styles))).toEqual([['classic_prep', 0.5], ['outdoor', 0.3], ['streetwear', 0.2]]);
  });

  it('runs on a fresh install (every migration from 0)', () => {
    const db = upTo(LATEST_VERSION);
    expect(db.prepare('SELECT COUNT(*) AS n FROM fit_checks').all()[0]!.n).toBe(0);
    expect(LATEST_VERSION).toBeGreaterThanOrEqual(6);
  });

  it('V6 (#91): the closet columns, closet_observations, and one sighting per existing item', () => {
    const db = upTo(5);
    db.exec(`INSERT INTO closet_items (id, name, slot, garment_json, source, created_at) VALUES
      ('C-1', 'Black sweatpants', 'bottom', '{"category":"bottom","subcategory":"sweatpants","color_family":"black"}', 'fitCheck', 100),
      ('C-2', 'Grey tee', 'top', '{"category":"top","subcategory":"tee","color_family":"grey"}', 'added', 200),
      ('T1', 'White tee', 'top', '{}', 'seed', 300)`);
    for (const s of MIGRATIONS.find((m) => m.version === 6)!.statements) db.exec(s);
    const rows = (sql: string) => db.prepare(sql).all();
    expect(rows('SELECT id, item_id, origin, decision, created_at, garment_json FROM closet_observations ORDER BY id')).toEqual([
      { id: 'O-C-1', item_id: 'C-1', origin: 'garment', decision: 'new', created_at: 100, garment_json: '{"category":"bottom","subcategory":"sweatpants","color_family":"black"}' },
      { id: 'O-C-2', item_id: 'C-2', origin: 'describe', decision: 'new', created_at: 200, garment_json: '{"category":"top","subcategory":"tee","color_family":"grey"}' },
      { id: 'O-T1', item_id: 'T1', origin: 'seed', decision: 'new', created_at: 300, garment_json: '{}' },
    ]);
    expect(rows('SELECT id, shade, profile, art, merged_into, maybe_same_as, updated_at FROM closet_items ORDER BY id')[0]).toEqual(
      { id: 'C-1', shade: null, profile: null, art: null, merged_into: null, maybe_same_as: null, updated_at: 100 },
    );
    expect(rows(`SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'closet_observations' AND name NOT LIKE 'sqlite_%' ORDER BY name`).map((r) => r.name))
      .toEqual(['closet_observations_check', 'closet_observations_item']);
  });
});
