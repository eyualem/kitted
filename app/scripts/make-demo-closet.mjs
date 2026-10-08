// Builds assets/demo-closet/closet-readings.json: the closet call's answer for each bundled demo photo (+ ph1),
// WITHOUT new API calls. Every answer is a real gemini-3.8-flash closet1 answer from the Oct 8 closet-call test
// (extraction-test/results/closet1/raw.json, run 0 of the same source photo), re-indexed to the stub list the app
// builds from that photo's bundled reading: a stub takes the test's entry for the same category + type, else the
// same category; a stub with no counterpart gets no entry (= not seen, which the app handles like a real miss).
// Run from app/: `node scripts/make-demo-closet.mjs`.
import fs from 'node:fs';
import path from 'node:path';

const APP = path.resolve(import.meta.dirname, '..');
const raw = JSON.parse(fs.readFileSync(path.join(APP, '../extraction-test/results/closet1/raw.json'), 'utf8'));
const index = JSON.parse(fs.readFileSync(path.join(APP, 'assets/demo-readings/INDEX.json'), 'utf8'));
const SLOTS = ['top', 'outerwear', 'bottom', 'footwear'];

const sources = Object.fromEntries(index.photos.map((p) => [p.id, { file: `assets/demo-readings/${p.id}.json`, photo: p.original_file.replace('inputs/fitcheck-photos/', '') }]));
sources.ph1 = { file: 'assets/demo-readings/variants/ph1_oct7_misread.json', photo: 'ph1/before_mirror.jpg' };

const out = {
  generated_by: 'app/scripts/make-demo-closet.mjs',
  provenance: 'real closet1 answers (extraction-test/results/closet1/raw.json, run 0), re-indexed to the bundled readings; no new calls',
  prompt_version: 'closet1',
  photos: {},
};
for (const [id, src] of Object.entries(sources)) {
  const f = JSON.parse(fs.readFileSync(path.join(APP, src.file), 'utf8'));
  const reading = f.reading ?? f;
  const stubs = [];
  reading.garments.forEach((g) => {
    if (SLOTS.includes(g.category) && g.certainty !== 'unsure') stubs.push({ i: stubs.length, category: g.category, subcategory: g.subcategory, color_family: g.color_family });
  });
  const run = raw.find((r) => r.photo === src.photo && r.run === 0);
  if (!run?.json) throw new Error(`no closet1 run 0 for ${src.photo}`);
  const testStubs = run.stubs.map(([i, g]) => ({ i, category: g.category, subcategory: g.subcategory }));
  const used = new Set();
  const garments = [];
  const mapping = [];
  for (const s of stubs) {
    const hit = testStubs.find((t) => !used.has(t.i) && t.category === s.category && t.subcategory === s.subcategory)
      ?? testStubs.find((t) => !used.has(t.i) && t.category === s.category);
    if (!hit) {
      mapping.push(`${s.i} ${s.category}/${s.subcategory}: not in the test's stubs (not seen)`);
      continue;
    }
    used.add(hit.i);
    const entry = run.json.garments.find((g) => g.i === hit.i);
    if (!entry) continue;
    garments.push({ ...entry, i: s.i });
    mapping.push(`${s.i} ${s.category}/${s.subcategory} <- test ${hit.i} ${hit.category}/${hit.subcategory}`);
  }
  out.photos[id] = { source: `${src.photo} run 0`, seconds: run.seconds, stubs, mapping, answer: { garments } };
}
fs.writeFileSync(path.join(APP, 'assets/demo-closet/closet-readings.json'), JSON.stringify(out, null, 1) + '\n');
console.log('wrote', Object.keys(out.photos).length, 'closet readings');
