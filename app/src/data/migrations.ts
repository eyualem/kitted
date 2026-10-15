// SQLite schema, versioned with PRAGMA user_version (05 §3.2, 06 §6).
// Never edit a shipped migration: add a new entry to MIGRATIONS instead.
// Rules: every column has a default, enums are stored as their string values, JSON blobs
// (readings, fixes, styles, id lists) are TEXT, no UNIQUE constraints beyond primary keys
// (keeps a later iCloud/server sync possible). Times are epoch milliseconds (INTEGER).

export interface Migration {
  version: number;
  statements: readonly string[];
}

const V1: Migration = {
  version: 1,
  statements: [
    // Small preferences: appearance, last occasion, idea time, onboarding step/done.
    `CREATE TABLE IF NOT EXISTS kv (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL DEFAULT ''
    )`,
    // One row (id = 'me'). styles = ordered JSON array of {name, weight}, never an object
    // keyed by style (the score depends on order, 04 §4.1). dress_code stays null in v1.
    `CREATE TABLE IF NOT EXISTS profile (
      id TEXT PRIMARY KEY NOT NULL DEFAULT 'me',
      birth_year INTEGER,
      height_cm REAL,
      build TEXT NOT NULL DEFAULT '',
      fit_preference TEXT NOT NULL DEFAULT '',
      styles TEXT NOT NULL DEFAULT '[]',
      boldness TEXT,
      budget TEXT,
      dress_code TEXT,
      last_occasion TEXT NOT NULL DEFAULT 'everyday',
      consent_version TEXT,
      consent_at INTEGER,
      onboarding_step TEXT NOT NULL DEFAULT 'welcome',
      onboarding_done INTEGER NOT NULL DEFAULT 0,
      paywall_shown_at INTEGER,
      idea_time TEXT,
      ideas_unopened INTEGER NOT NULL DEFAULT 0,
      units TEXT NOT NULL DEFAULT 'imperial',
      created_at INTEGER NOT NULL DEFAULT 0
    )`,
    // "What your stylist knows". Deleted facts stay as tombstones so they're never re-learned.
    `CREATE TABLE IF NOT EXISTS facts (
      id TEXT PRIMARY KEY NOT NULL,
      key TEXT NOT NULL DEFAULT '',
      value TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT 'told',
      created_at INTEGER NOT NULL DEFAULT 0,
      is_deleted INTEGER NOT NULL DEFAULT 0
    )`,
    // Readings are never updated in place; corrections and merges insert new rows.
    // source: full / lower / recheckMerged / corrected / userConfirmed ("Tell me", 04 §6).
    // reading_json = the v3 reading (scene + garments + the demo-only held_items).
    `CREATE TABLE IF NOT EXISTS readings (
      id TEXT PRIMARY KEY NOT NULL,
      image_hash TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT 'full',
      reading_json TEXT NOT NULL DEFAULT '{}',
      model TEXT NOT NULL DEFAULT '',
      prompt_version TEXT NOT NULL DEFAULT '',
      schema_version TEXT NOT NULL DEFAULT 'v3',
      latency_ms INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE INDEX IF NOT EXISTS readings_image_hash ON readings (image_hash, source)`,
    // status: scoring / scored / unreadable / notClothed / failed / held (ruling 27).
    // fixes = JSON of the core's camelCase Fix[] (as suggestFixes() returns them).
    `CREATE TABLE IF NOT EXISTS fit_checks (
      id TEXT PRIMARY KEY NOT NULL,
      created_at INTEGER NOT NULL DEFAULT 0,
      day_key TEXT NOT NULL DEFAULT '',
      photo_file TEXT,
      thumb_file TEXT,
      demo_photo_id TEXT,
      image_hash TEXT NOT NULL DEFAULT '',
      occasion TEXT NOT NULL DEFAULT 'everyday',
      status TEXT NOT NULL DEFAULT 'scoring',
      is_partial INTEGER NOT NULL DEFAULT 0,
      not_rated TEXT NOT NULL DEFAULT '[]',
      score REAL,
      raw_score REAL,
      subscores TEXT NOT NULL DEFAULT '{}',
      occasion_adj REAL NOT NULL DEFAULT 0,
      rules_fired TEXT NOT NULL DEFAULT '[]',
      credits TEXT NOT NULL DEFAULT '[]',
      advice TEXT NOT NULL DEFAULT '[]',
      fixes TEXT NOT NULL DEFAULT '[]',
      explanation TEXT,
      rubric_version TEXT NOT NULL DEFAULT '',
      is_favorite INTEGER NOT NULL DEFAULT 0,
      snap_state TEXT NOT NULL DEFAULT 'none',
      recheck_used INTEGER NOT NULL DEFAULT 0,
      is_first_check INTEGER NOT NULL DEFAULT 0,
      reading_id TEXT,
      parent_id TEXT,
      item_ids TEXT NOT NULL DEFAULT '[]'
    )`,
    `CREATE INDEX IF NOT EXISTS fit_checks_day ON fit_checks (day_key)`,
    // garment_json = the item's v3 garment (seed.json → closet[].garment); hex = tile color.
    `CREATE TABLE IF NOT EXISTS closet_items (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      slot TEXT NOT NULL DEFAULT 'top',
      garment_json TEXT NOT NULL DEFAULT '{}',
      hex TEXT NOT NULL DEFAULT '#ECEEF1',
      confirmed_fields TEXT NOT NULL DEFAULT '[]',
      photo_file TEXT,
      demo_photo_id TEXT,
      is_photographed INTEGER NOT NULL DEFAULT 1,
      source TEXT NOT NULL DEFAULT 'fitCheck',
      starter_id TEXT,
      worn_count INTEGER NOT NULL DEFAULT 0,
      last_worn_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT 0,
      is_deleted INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS outfits (
      id TEXT PRIMARY KEY NOT NULL,
      item_ids TEXT NOT NULL DEFAULT '[]',
      occasion TEXT NOT NULL DEFAULT 'everyday',
      summary TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT 'idea',
      is_saved INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT 0
    )`,
    // One row per logged day (local date, 4 am rollover). Feeds the calendar and the counts.
    `CREATE TABLE IF NOT EXISTS wear_log (
      day TEXT PRIMARY KEY NOT NULL,
      fit_check_id TEXT,
      outfit_id TEXT,
      created_at INTEGER NOT NULL DEFAULT 0
    )`,
    // kind: wrongItem / wrongDetail / fixDoesntApply / scoreOff / fixConfirmed (02 S21).
    `CREATE TABLE IF NOT EXISTS corrections (
      id TEXT PRIMARY KEY NOT NULL,
      fit_check_id TEXT NOT NULL DEFAULT '',
      kind TEXT NOT NULL DEFAULT 'wrongDetail',
      field TEXT,
      old_value TEXT,
      new_value TEXT,
      user_score REAL,
      score_before REAL,
      score_after REAL,
      sent_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT 0
    )`,
    // The Stylist thread. kind: text / photo / card; card_type: fitCheck, recheck, outfit, item, …
    `CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY NOT NULL,
      created_at INTEGER NOT NULL DEFAULT 0,
      role TEXT NOT NULL DEFAULT 'stylist',
      kind TEXT NOT NULL DEFAULT 'text',
      text TEXT,
      card_type TEXT,
      fit_check_id TEXT,
      outfit_id TEXT,
      item_id TEXT,
      chips TEXT NOT NULL DEFAULT '[]',
      payload TEXT NOT NULL DEFAULT '{}'
    )`,
    `CREATE INDEX IF NOT EXISTS chat_messages_time ON chat_messages (created_at)`,
    // Local mirror of usage for the UI. The server is the source of truth (M4).
    `CREATE TABLE IF NOT EXISTS usage_days (
      day_key TEXT PRIMARY KEY NOT NULL,
      checks INTEGER NOT NULL DEFAULT 0,
      rechecks INTEGER NOT NULL DEFAULT 0,
      questions INTEGER NOT NULL DEFAULT 0,
      items INTEGER NOT NULL DEFAULT 0,
      server_remaining TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS event_queue (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      props TEXT NOT NULL DEFAULT '{}',
      at INTEGER NOT NULL DEFAULT 0
    )`,
  ],
};

// V2 (P2): card details and reading lineage.
const V2: Migration = {
  version: 2,
  statements: [
    `ALTER TABLE fit_checks ADD COLUMN details TEXT NOT NULL DEFAULT '{}'`,
    `ALTER TABLE readings ADD COLUMN derived_from TEXT`,
  ],
};

// V3 (P2): outfit idea titles and their predicted score.
const V3: Migration = {
  version: 3,
  statements: [`ALTER TABLE outfits ADD COLUMN title TEXT`, `ALTER TABLE outfits ADD COLUMN details TEXT NOT NULL DEFAULT '{}'`],
};

// The morning/evening card (02 "S1d", DECISIONS-LOG #58–62): one locked idea per day key and slot,
// and the one style a check was scored for.
const V4: Migration = {
  version: 4,
  statements: [
    `CREATE TABLE IF NOT EXISTS daily_ideas (
      id TEXT PRIMARY KEY NOT NULL,
      day_key TEXT NOT NULL DEFAULT '',
      slot TEXT NOT NULL DEFAULT 'day',
      occasion TEXT NOT NULL DEFAULT 'everyday',
      style TEXT,
      outfit_id TEXT,
      weather TEXT,
      message_id TEXT,
      state TEXT NOT NULL DEFAULT 'idea',
      fit_check_id TEXT,
      created_at INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE INDEX IF NOT EXISTS daily_ideas_day ON daily_ideas (day_key)`,
    `ALTER TABLE fit_checks ADD COLUMN style TEXT`,
  ],
};

// V5 (Oct 8, #85): the style keys follow rubric v4's names. preppy and old_money became
// classic_prep, gorpcore became outdoor: the one style on checks and ideas, the remembered card
// style (kv), the "style" a re-scored check was for (fit_checks.details), and his ordered picks
// (profile.styles, a JSON array of [name, weight]; only quoted keys are replaced, so order and
// weights stay). The app also normalizes on read (normStyleKey), so a missed row still works.
const V5: Migration = {
  version: 5,
  statements: [
    `UPDATE fit_checks SET style = 'classic_prep' WHERE style IN ('preppy', 'old_money')`,
    `UPDATE fit_checks SET style = 'outdoor' WHERE style = 'gorpcore'`,
    `UPDATE daily_ideas SET style = 'classic_prep' WHERE style IN ('preppy', 'old_money')`,
    `UPDATE daily_ideas SET style = 'outdoor' WHERE style = 'gorpcore'`,
    `UPDATE kv SET value = 'classic_prep' WHERE key IN ('idea.style.day', 'idea.style.evening') AND value IN ('preppy', 'old_money')`,
    `UPDATE kv SET value = 'outdoor' WHERE key IN ('idea.style.day', 'idea.style.evening') AND value = 'gorpcore'`,
    `UPDATE fit_checks SET details = REPLACE(REPLACE(REPLACE(details, '"style":"preppy"', '"style":"classic_prep"'), '"style":"old_money"', '"style":"classic_prep"'), '"style":"gorpcore"', '"style":"outdoor"')`,
    `UPDATE profile SET styles = REPLACE(REPLACE(REPLACE(styles, '"preppy"', '"classic_prep"'), '"old_money"', '"classic_prep"'), '"gorpcore"', '"outdoor"')`,
  ],
};

// V6 (Oct 8, #91): closet accuracy. Each closet item keeps its display shade (a fixed ShadeKey id, never the
// model's words), its profile (aliases, "different from", what he confirmed), the detailed-graphic inputs (art),
// a crop slot for phase 3, and the merge / "maybe the same as" flags. Every sighting of a piece is a row in
// closet_observations (the v3 garment after corrections + the closet call's fields), so a correction follows
// the stored link instead of re-matching. Existing items get one sighting each from their own garment.
const V6: Migration = {
  version: 6,
  statements: [
    `ALTER TABLE closet_items ADD COLUMN shade TEXT`,
    `ALTER TABLE closet_items ADD COLUMN profile TEXT`,
    `ALTER TABLE closet_items ADD COLUMN crop_file TEXT`,
    `ALTER TABLE closet_items ADD COLUMN crop_score REAL`,
    `ALTER TABLE closet_items ADD COLUMN art TEXT`,
    `ALTER TABLE closet_items ADD COLUMN merged_into TEXT`,
    `ALTER TABLE closet_items ADD COLUMN maybe_same_as TEXT`,
    `ALTER TABLE closet_items ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0`,
    // origin: garment / held / snap / seed / describe. decision: pending / same / new / ask / answeredSame /
    // answeredNew / split / undone. closet_json = the validated closet-call fields (null: v3 only).
    `CREATE TABLE IF NOT EXISTS closet_observations (
      id TEXT PRIMARY KEY NOT NULL,
      item_id TEXT NOT NULL DEFAULT '',
      fit_check_id TEXT,
      reading_id TEXT,
      closet_reading_id TEXT,
      garment_index INTEGER,
      origin TEXT NOT NULL DEFAULT 'garment',
      garment_json TEXT NOT NULL DEFAULT '{}',
      closet_json TEXT,
      sampled_hex TEXT,
      sampled_l REAL,
      crop_file TEXT,
      crop_quality REAL,
      decision TEXT NOT NULL DEFAULT 'new',
      identity_score REAL,
      candidates TEXT NOT NULL DEFAULT '[]',
      ask_item_id TEXT,
      answered_at INTEGER,
      user_confirmed TEXT,
      created_at INTEGER NOT NULL DEFAULT 0,
      is_deleted INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE INDEX IF NOT EXISTS closet_observations_item ON closet_observations (item_id)`,
    `CREATE INDEX IF NOT EXISTS closet_observations_check ON closet_observations (fit_check_id)`,
    `INSERT INTO closet_observations (id, item_id, origin, garment_json, decision, created_at, is_deleted)
      SELECT 'O-' || id, id, CASE source WHEN 'seed' THEN 'seed' WHEN 'fitCheck' THEN 'garment' ELSE 'describe' END,
        garment_json, 'new', created_at, 0 FROM closet_items`,
    `UPDATE closet_items SET updated_at = created_at`,
  ],
};

// V7 (Oct 15, #288): the sync engine's bookkeeping (handoff/11-firestore-schema.md §4). A shadow row per synced row
// says when it last changed here and whether that reached the server, so the 14 domain tables stay as they are
// (replaces 08 §7.1's "updated_at on every table"). Empty until he signs in; "Delete all my data" wipes them too.
const V7: Migration = {
  version: 7,
  statements: [
    `CREATE TABLE IF NOT EXISTS sync_rows (
      id TEXT PRIMARY KEY NOT NULL,
      coll TEXT NOT NULL DEFAULT '',
      row_key TEXT NOT NULL DEFAULT '',
      local_at INTEGER NOT NULL DEFAULT 0,
      pushed_at INTEGER,
      deleted INTEGER NOT NULL DEFAULT 0,
      by_device TEXT NOT NULL DEFAULT '',
      files TEXT NOT NULL DEFAULT '[]'
    )`,
    `CREATE TABLE IF NOT EXISTS sync_files (
      path TEXT PRIMARY KEY NOT NULL,
      op TEXT NOT NULL DEFAULT 'up',
      tries INTEGER NOT NULL DEFAULT 0,
      next_at INTEGER NOT NULL DEFAULT 0,
      queued_at INTEGER NOT NULL DEFAULT 0
    )`,
  ],
};

export const MIGRATIONS: readonly Migration[] = [V1, V2, V3, V4, V5, V6, V7];

export const LATEST_VERSION: number = MIGRATIONS[MIGRATIONS.length - 1]?.version ?? 0;

/** Table names, for resetData (drop everything but keep the schema). */
export const TABLES = [
  'kv',
  'profile',
  'facts',
  'readings',
  'fit_checks',
  'closet_items',
  'outfits',
  'wear_log',
  'corrections',
  'chat_messages',
  'usage_days',
  'event_queue',
  'daily_ideas',
  'closet_observations',
  'sync_rows',
  'sync_files',
] as const;

/** The migrations still to run from `current` (sorted, strictly newer). */
export function pendingMigrations(current: number): Migration[] {
  return MIGRATIONS.filter((m) => m.version > current).sort((a, b) => a.version - b.version);
}
