// Plain-Node verifier for @kitted/core: no npm install, no network.
// Compile src/ with any TypeScript, then point this at the output directory:
//
//   node <typescript>/bin/tsc -p tsconfig.build.json --outDir /tmp/kcbuild
//   node scripts/verify.mjs /tmp/kcbuild
//
// Checks EVERY case in fixtures/rubric_parity.json (exact equality, unrounded doubles bit for bit) and every
// expectation in fixtures/expected_scores.json and fixtures/rotation_expected.json. Exit code 1 on any mismatch.
import { register } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const buildDir = process.argv[2];
if (!buildDir) {
  console.error("usage: node scripts/verify.mjs <compiled-output-dir>");
  process.exit(2);
}
// The sources use extensionless relative imports (what Metro / Vite / esbuild expect). Plain Node ESM needs
// ".js", so add it at resolve time instead of changing the sources.
const hook = `export async function resolve(spec, ctx, next) {
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\\.[cm]?js$/.test(spec)) {
    try { return await next(spec + ".js", ctx); } catch (e) {}
  }
  return next(spec, ctx);
}`;
register("data:text/javascript," + encodeURIComponent(hook));
const K = await import(pathToFileURL(resolve(buildDir, "index.js")).href);

// handoff/fixtures, from handoff/ts/kitted-core (../../fixtures) or app/packages/kitted-core (../../../handoff/fixtures).
// KITTED_FIXTURES=<dir> overrides both.
const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIX_CANDIDATES = [process.env.KITTED_FIXTURES, resolve(PKG, "../../fixtures"), resolve(PKG, "../../../handoff/fixtures")].filter(Boolean);
const FIX = FIX_CANDIDATES.find((d) => existsSync(join(d, "rubric_parity.json")));
if (!FIX) {
  console.error("handoff/fixtures not found; tried " + FIX_CANDIDATES.join(", "));
  process.exit(2);
}
const load = (p) => JSON.parse(readFileSync(join(FIX, p), "utf8"));
const reading = (id) => load(existsSync(join(FIX, "readings", id + ".json")) ? `readings/${id}.json` : `readings/variants/${id}.json`);

let failures = 0;
const fail = (msg) => {
  failures++;
  if (failures <= 25) console.log("  FAIL " + msg);
};
const eq = K.deepEqual;
const show = (v) => JSON.stringify(v);

// ---------------------------------------------------------------- TS result -> rubric.py dict
function toPy(r) {
  if (r.overall === null) return { overall: null, reason: r.reason, partial: r.partial, rules_fired: r.rulesFired };
  return {
    overall: r.overall, raw_score: r.rawScore, subscores: r.subscores, occasion_adj: r.occasionAdj,
    credits: r.credits, credit_points: r.creditPoints, mistake_points: r.mistakePoints, rules_fired: r.rulesFired,
    advice: r.advice, partial: r.partial, not_rated: r.notRated,
    raw_unrounded: r.rawUnrounded, credit_unrounded: r.creditUnrounded, mistakes_unrounded: r.mistakesUnrounded,
  };
}
const fixToPy = (f) => ({
  target: f.target, tier: f.tier, effort: f.effort, free: f.free, to: f.to, to_raw: f.toRaw, gain: f.gain,
  raw_gain: f.rawGain, edits: f.edits, item_id: f.itemId, copy: f.copy, tag: f.tag,
});
function suggestionsToPy(s) {
  const o = { base_overall: s.baseOverall, base_raw: s.baseRaw, fixes: s.fixes.map(fixToPy), next_level: s.nextLevel, tips: s.tips };
  if (s.dialedIn !== undefined) o.dialed_in = s.dialedIn;
  return o;
}
/** Compare the keys rubric.py returned; numbers with === (exact doubles; -0 === 0). */
function compareResult(label, got, want, fieldFails) {
  let ok = true;
  const gk = Object.keys(got).sort();
  const wk = Object.keys(want).filter((k) => k !== "word" && k !== "partial_label").sort();
  if (!eq(gk, wk)) {
    ok = false;
    fieldFails["(keys)"] = (fieldFails["(keys)"] || 0) + 1;
    fail(`${label}: keys ${show(gk)} != ${show(wk)}`);
  }
  for (const k of wk) {
    if (!eq(got[k], want[k])) {
      ok = false;
      fieldFails[k] = (fieldFails[k] || 0) + 1;
      fail(`${label}: ${k} got ${show(got[k])} want ${show(want[k])}`);
    }
  }
  return ok;
}

// ---------------------------------------------------------------- 1. rubric parity (5,694 cases)
const P = load("rubric_parity.json");
const snapshots = new Map(Object.entries(P.readings).map(([id, r]) => [id, JSON.stringify(r)]));
let parityOk = 0;
let fpOk = 0;
let fpTotal = 0;
const parityFieldFails = {};
for (const c of P.cases) {
  const got = toPy(K.score(P.readings[c.reading], { occasion: c.occasion, styles: c.styles, boldness: c.boldness }));
  const ok = compareResult(`parity ${c.reading}@${c.occasion} ${show(c.styles)} ${c.boldness}`, got, c.expected, parityFieldFails);
  if (ok) parityOk++;
  if (c.fp_boundary) {
    fpTotal++;
    if (ok) fpOk++;
  }
}
let mutated = 0;
for (const [id, snap] of snapshots) if (JSON.stringify(P.readings[id]) !== snap) mutated++;
if (mutated) fail(`score() mutated ${mutated} input readings`);
console.log(`rubric parity: ${parityOk}/${P.cases.length} cases match exactly (fp_boundary ${fpOk}/${fpTotal}; ` +
  `inputs mutated: ${mutated})` + (Object.keys(parityFieldFails).length ? ` field failures ${show(parityFieldFails)}` : ""));

// ---------------------------------------------------------------- 2. expected_scores.json
const E = load("expected_scores.json");
const SEED = load("seed.json");
const CLOSET = SEED.scenarios.full.closet;
const DEMO = E.profile.styles;

let casesOk = 0;
const by = {};
const caseFieldFails = {};
for (const c of E.cases) {
  const res = K.score(reading(c.reading), { occasion: c.occasion, styles: c.styles, boldness: c.boldness });
  const got = toPy(res);
  got.word = K.scoreWord(res.overall);
  got.partial_label = K.partialLabel(res.overall === null ? [] : res.notRated);
  by[c.id] = got;
  let ok = compareResult(`case ${c.id}`, Object.fromEntries(Object.entries(got).filter(([k]) => k !== "word" && k !== "partial_label")), c.expected, caseFieldFails);
  for (const k of ["word", "partial_label"]) {
    if (!eq(got[k], c.expected[k])) {
      ok = false;
      fail(`case ${c.id}: ${k} got ${show(got[k])} want ${show(c.expected[k])}`);
    }
  }
  if (ok) casesOk++;
}
console.log(`demo score cases: ${casesOk}/${E.cases.length}`);

let checksOk = 0;
for (const m of E.mockup_checks) {
  if (eq(by[m.case]?.[m.field], m.want)) checksOk++;
  else fail(`mockup check ${m.case}.${m.field}: got ${show(by[m.case]?.[m.field])} want ${show(m.want)}`);
}
console.log(`mockup checks: ${checksOk}/${E.mockup_checks.length}`);

let fixesOk = 0;
const fixOut = {};
for (const f of E.fixes) {
  const r = reading(f.reading);
  const closet = f.closet === "empty" ? [] : CLOSET;
  const before = JSON.stringify([r, closet]);
  const out = K.suggestFixes(r, { occasion: f.occasion, styles: DEMO, closet, firstCheck: f.firstCheck });
  fixOut[f.id] = out;
  const got = suggestionsToPy(out);
  const ok = eq(got, f.expected) && JSON.stringify([r, closet]) === before;
  if (ok) fixesOk++;
  else fail(`fixes ${f.id}:\n    got  ${show(got)}\n    want ${show(f.expected)}`);
}
console.log(`fix engine cases: ${fixesOk}/${E.fixes.length}`);

let rechecksOk = 0;
const first = reading("p01b");
const firstFix = fixOut["fix:p01b@date#firstRun"].fixes;
const targets = K.fixTargets(firstFix);
const baseP01b = by["p01b@date"];
for (const rc of E.rechecks) {
  let got;
  if (rc.id === "recheck:tell-me") {
    const told = K.applyFix(first, firstFix[0]);
    const s = K.score(told, { occasion: "date", styles: DEMO });
    got = { merged_reading: told, overall: s.overall, raw_unrounded: s.rawUnrounded, rules_fired: s.rulesFired };
  } else {
    if (!eq(targets, rc.targets)) fail(`recheck ${rc.id}: fixTargets ${show(targets)} != ${show(rc.targets)}`);
    const { merged, notes } = K.recheckMerge(first, reading(rc.new), rc.targets, { occasion: rc.occasion, styles: DEMO });
    const s = K.score(merged, { occasion: rc.occasion, styles: DEMO });
    got = {
      merged_reading: merged, notes, overall: s.overall, raw_unrounded: s.rawUnrounded, rules_fired: s.rulesFired,
      credits: s.credits, delta_display: s.overall - baseP01b.overall,
      delta_raw: K.pyRound(s.rawUnrounded - baseP01b.raw_unrounded, 6),
    };
  }
  if (eq(got, rc.expected)) rechecksOk++;
  else fail(`recheck ${rc.id}:\n    got  ${show(got)}\n    want ${show(rc.expected)}`);
}
console.log(`re-check cases: ${rechecksOk}/${E.rechecks.length} (fixTargets = ${show(targets)})`);

let corrOk = 0;
for (const c of E.corrections) {
  const r = K.applyCorrection(reading(c.reading), c.garmentIndex, c.field, c.to);
  const s = K.score(r, { occasion: c.occasion, styles: DEMO });
  const got = { overall: s.overall, raw_unrounded: s.rawUnrounded, rules_fired: s.rulesFired,
    line: K.correctionLine(by[`${c.reading}@${c.occasion}`].overall, s.overall), closetPill: c.expected.closetPill };
  const untouched = reading(c.reading).garments[c.garmentIndex][c.field] === c.from;
  if (eq(got, c.expected) && untouched) corrOk++;
  else fail(`correction ${c.id}: got ${show(got)} want ${show(c.expected)}`);
}
console.log(`correction cases: ${corrOk}/${E.corrections.length}`);

let partOk = 0;
const s24 = reading("s24");
for (const p of E.partials) {
  const r = p.snap_reading ? K.mergeShoeSnap(s24, p.snap_reading) : K.pickShoesFromCloset(s24, CLOSET.find((c) => c.id === "S1"));
  const s = K.score(r, { occasion: "everyday", styles: DEMO });
  const got = { reading: r, overall: s.overall, raw_unrounded: s.rawUnrounded, rules_fired: s.rulesFired, credits: s.credits,
    not_rated: s.notRated, partial: s.partial };
  if (eq(got, p.expected)) partOk++;
  else fail(`partial ${p.id}:\n    got  ${show(got)}\n    want ${show(p.expected)}`);
}
console.log(`partial-check cases: ${partOk}/${E.partials.length}`);

// ---------------------------------------------------------------- 3. Rotation (rotation_expected.json)
const RX = load("rotation_expected.json");
const NEXT = SEED.scenarios.full.nextBestBuy;
let rotChecks = 0;
let rotOk = 0;
const rcheck = (label, got, want) => {
  rotChecks++;
  if (eq(got, want)) rotOk++;
  else fail(`rotation ${label}: got ${show(got)} want ${show(want)}`);
};
const rot = K.rotation(CLOSET, RX.styles);
const rotCore = K.rotation(CLOSET, RX.styles, { layers: false });
rcheck("with layers", rot.count, RX.rotation_with_layers);
rcheck("core only", rotCore.count, RX.rotation_core_only);
const before = K.rotation(CLOSET.filter((c) => c.createdAt.slice(0, 10) < "2026-10-18"), RX.styles).count;
rcheck("before this week", before, RX.rotation_before_this_week);
rcheck("week delta", rot.count - before, RX.week_delta);
for (const c of CLOSET) {
  rcheck(`per item ${c.id}`, rot.count - K.rotation(CLOSET.filter((x) => x !== c), RX.styles).count, RX.fits_added_per_item[c.id]);
}
for (const b of NEXT) {
  let got;
  if (b.slot === "extra") got = { layers: 0, coreOnly: 0 };
  else {
    const nb = { id: "NEW", name: b.name, slot: b.slot, garment: b.garment };
    got = { layers: K.rotation([...CLOSET, nb], RX.styles).count - rot.count,
      coreOnly: K.rotation([...CLOSET, nb], RX.styles, { layers: false }).count - rotCore.count };
  }
  rcheck(`next buy ${b.id}`, got, RX.next_buy_fits_added[b.id]);
}
rcheck("first 10 combos", rot.combos.slice(0, 10).map((k) => k.map((x) => (x ? [...x] : null))), RX.first_10_combos);
console.log(`rotation checks: ${rotOk}/${rotChecks} (with layers ${rot.count}, core only ${rotCore.count})`);

// ---------------------------------------------------------------- 4. rounding helpers
const R = [
  [K.roundHalf(8.75), 9.0], [K.roundHalf(7.775), 8.0], [K.roundHalf(9.25), 9.5], [K.roundHalf(6.749999999999999), 6.5],
  [K.roundHalf(7.250000000000002), 7.5], [K.nearest(0.5), 1], [K.nearest(1.5), 2],
  [K.pyRound(0.125, 2), 0.12], [K.pyRound(0.375, 2), 0.38], [K.pyRound(2.675, 2), 2.67], [K.pyRound(6.774999999999999, 3), 6.775],
  [K.pyRound(0.22500000000000142, 2), 0.23], [K.pyRound(1.0005, 3), 1.0], [K.pyRound(8.350000000000001, 3), 8.35],
];
const roundOk = R.filter(([g, w]) => g === w).length;
R.forEach(([g, w], i) => g !== w && fail(`rounding #${i}: got ${g} want ${w}`));
console.log(`rounding checks: ${roundOk}/${R.length}`);

if (failures) {
  console.log(`\nFAILED: ${failures} mismatch(es)`);
  process.exit(1);
}
console.log("\nALL CHECKS PASSED");
