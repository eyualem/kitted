#!/usr/bin/env node
// npm run guard:release (05 §P8, 09 §20.7 R1.2, #322): make a production iOS export and refuse it if it holds a
// secret, or if the default config would ship the demo tools.
//   - any Google-shaped key (AIza…) except the Firebase web key, which is bundled on purpose (public by design, #295);
//   - the exact value of every other secret in app/.env* (the dev Gemini key, the OpenAI and Anthropic test keys);
//   - an OpenAI/Anthropic-shaped key (sk-…) of any value.
// The Gemini key is read only inside `if (__DEV__)`, so a production bundle must not contain it; this proves it.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const APP = path.join(__dirname, '..');
const OUT = path.join(APP, 'build', 'export');
/** Keys whose values ship on purpose. */
const PUBLIC_KEYS = new Set(['EXPO_PUBLIC_FIREBASE_API_KEY']);
const GOOGLE_KEY = /AIza[0-9A-Za-z_-]{35}/g;
const SK_KEY = /sk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}/g;

/** KEY=VALUE lines of a dotenv file (comments and blanks skipped, quotes dropped). */
function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return out;
}

/** The secret values to look for, and the values allowed to ship, from every app/.env* file. */
function secretsFrom(envs) {
  const secrets = new Map();
  const allowed = new Set();
  for (const env of envs) {
    for (const [k, v] of Object.entries(env)) {
      if (!v || v.length < 16) continue;
      if (PUBLIC_KEYS.has(k)) allowed.add(v);
      else secrets.set(v, k);
    }
  }
  for (const v of allowed) secrets.delete(v);
  return { secrets, allowed };
}

/** What a bundle must not hold. `files`: { path, text } with text read as latin1 (Hermes bytecode keeps strings as bytes). */
function scan(files, { secrets, allowed }) {
  const problems = [];
  for (const f of files) {
    for (const [value, name] of secrets) if (f.text.includes(value)) problems.push(`${f.path}: the value of ${name}`);
    for (const m of f.text.matchAll(GOOGLE_KEY)) if (!allowed.has(m[0])) problems.push(`${f.path}: a Google API key that isn't the Firebase web key (${m[0].slice(0, 8)}…)`);
    for (const m of f.text.matchAll(SK_KEY)) problems.push(`${f.path}: an sk- key (${m[0].slice(0, 7)}…)`);
  }
  return [...new Set(problems)];
}

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function main() {
  const env = { ...process.env };
  delete env.KITTED_DEMO; // the default a release script gets
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

  // 1. The default config must not turn the demo tools on (it says null: follow the build, off in Release).
  const cfg = JSON.parse(execFileSync(npx, ['expo', 'config', '--json', '--type', 'public'], { cwd: APP, env, encoding: 'utf8' }));
  const demo = cfg.extra ? cfg.extra.demo : undefined;
  if (demo === true) {
    console.error('guard:release FAILED: with KITTED_DEMO unset the config turns the demo tools on (extra.demo = true).');
    process.exit(1);
  }

  // 2. A production export, as a Release build bundles it.
  fs.rmSync(OUT, { recursive: true, force: true });
  execFileSync(npx, ['expo', 'export', '--platform', 'ios', '--output-dir', OUT], { cwd: APP, env, stdio: 'inherit' });

  // 3. No secret in it.
  const envFiles = fs.readdirSync(APP).filter((n) => n === '.env' || n.startsWith('.env.'));
  const { secrets, allowed } = secretsFrom(envFiles.map((n) => parseEnv(fs.readFileSync(path.join(APP, n), 'utf8'))));
  const files = walk(OUT).map((p) => ({ path: path.relative(APP, p), text: fs.readFileSync(p).toString('latin1') }));
  const problems = scan(files, { secrets, allowed });
  if (problems.length > 0) {
    console.error('guard:release FAILED: the production bundle holds secrets:');
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(`guard:release passed: ${files.length} files, ${secrets.size} secret values and every key shape checked; demo default: ${demo === false ? 'off' : 'follows the build (off in Release)'}.`);
}

module.exports = { parseEnv, secretsFrom, scan };
if (require.main === module) main();
