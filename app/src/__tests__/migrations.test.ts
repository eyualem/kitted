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
