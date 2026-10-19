#!/usr/bin/env node
// The founder's waitlist jobs (handoff/15-landing-page.md §6). From firebase/, after `npm --prefix functions run build`:
//   node scripts/waitlist.mjs export --batch 1 --size 25   → inputs/waitlist/batch-1.csv (TestFlight's tester import)
//   node scripts/waitlist.mjs delete someone@example.com    → removes one signup (a request to support)
//   node scripts/waitlist.mjs stats                         → visits and signups per day, by source and device
// It talks to the real project with your Google credentials (`gcloud auth application-default login`), or to the
// emulator when FIRESTORE_EMULATOR_HOST is set.
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, '../functions/package.json'));
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const admin = require('../functions/lib/waitlist/admin.js');

const [cmd, ...rest] = process.argv.slice(2);
const flag = (name) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : undefined;
};
initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? 'kitted-a5b45' });
const db = getFirestore();

if (cmd === 'export') {
  const batch = Number(flag('batch'));
  const size = Number(flag('size'));
  if (!Number.isInteger(batch) || !Number.isInteger(size) || size < 1) throw new Error('Use: export --batch <n> --size <n>');
  const rows = await admin.exportBatch(db, { batch, size, now: Date.now() });
  const out = join(here, '../../inputs/waitlist');
  mkdirSync(out, { recursive: true });
  const file = join(out, `batch-${batch}.csv`);
  writeFileSync(file, admin.toTestFlightCsv(rows));
  console.log(`${rows.length} people in batch ${batch} → ${file}`);
} else if (cmd === 'delete') {
  const email = rest[0];
  if (!email) throw new Error('Use: delete <email>');
  console.log((await admin.deleteEmail(db, email)) ? 'Deleted.' : 'Not on the list.');
} else if (cmd === 'stats') {
  const snap = await db.collection('waitlist_stats').get();
  for (const d of snap.docs.sort((a, b) => a.id.localeCompare(b.id))) console.log(d.id, JSON.stringify(d.data()));
} else {
  console.log('Commands: export --batch <n> --size <n> · delete <email> · stats');
}
