#!/usr/bin/env node
// npm run check:app -- <path to Kitted.app> [--paid] (09 §27 A3, #366): checks a built Release app (a local build, or an
// EAS .ipa unzipped: Payload/Kitted.app) before it goes to testers.
//   - Info.plist: none of the dev launcher's local-network keys or dev-menu keys (its build phase strips them outside Debug);
//   - PrivacyInfo.xcprivacy: every required-reason category the app declares (app.config.ts), no tracking;
//   - the entitlements: Sign in with Apple in every build; the paid team's other three with --paid, none of them without.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REQUIRED_API_CATEGORIES = [
  'NSPrivacyAccessedAPICategoryUserDefaults',
  'NSPrivacyAccessedAPICategoryFileTimestamp',
  'NSPrivacyAccessedAPICategorySystemBootTime',
  'NSPrivacyAccessedAPICategoryDiskSpace',
];
const PAID_ENTITLEMENTS = [
  'com.apple.developer.declared-age-range',
  'com.apple.developer.devicecheck.appattest-environment',
  'com.apple.developer.weatherkit',
  'com.apple.developer.applesignin',
];

const APPLE_SIGN_IN = 'com.apple.developer.applesignin';

/** Problems with a built app's plist, manifest and entitlements (parsed objects). Pure, for the tests. Sign in with Apple is
 *  required whatever `paid` says (T41); the other three belong to the paid team. */
function checkApp({ info, privacy, entitlements, paid }) {
  const problems = [];
  if ((info.NSBonjourServices ?? []).some((s) => String(s).toLowerCase().startsWith('_expo._tcp'))) problems.push('Info.plist still lists the dev launcher\'s _expo._tcp Bonjour service');
  if (/Expo Dev Launcher/.test(String(info.NSLocalNetworkUsageDescription ?? ''))) problems.push('Info.plist still has the dev launcher\'s local-network string');
  for (const k of Object.keys(info)) if (/^(EXDevMenu|DEV_CLIENT_)/.test(k)) problems.push(`Info.plist has the dev key ${k}`);
  if (!privacy) problems.push('no PrivacyInfo.xcprivacy in the app');
  else {
    const have = new Set((privacy.NSPrivacyAccessedAPITypes ?? []).map((t) => t.NSPrivacyAccessedAPIType));
    for (const c of REQUIRED_API_CATEGORIES) if (!have.has(c)) problems.push(`PrivacyInfo.xcprivacy doesn't declare ${c}`);
    if (privacy.NSPrivacyTracking !== false) problems.push('PrivacyInfo.xcprivacy doesn\'t say NSPrivacyTracking = false');
    if ((privacy.NSPrivacyCollectedDataTypes ?? []).length === 0) problems.push('PrivacyInfo.xcprivacy declares no collected data');
  }
  if (!(APPLE_SIGN_IN in entitlements)) problems.push(`the entitlement ${APPLE_SIGN_IN} is missing, so Continue with Apple can't sign in`);
  for (const k of PAID_ENTITLEMENTS) {
    if (k === APPLE_SIGN_IN) continue;
    if (paid && !(k in entitlements)) problems.push(`the paid entitlement ${k} is missing`);
    if (!paid && k in entitlements) problems.push(`the paid entitlement ${k} is on, but the switch is off`);
  }
  return problems;
}

function plistJson(file) {
  return JSON.parse(execFileSync('plutil', ['-convert', 'json', '-o', '-', file], { encoding: 'utf8' }));
}

function entitlementsOf(app) {
  try {
    const xml = execFileSync('codesign', ['-d', '--entitlements', '-', '--xml', app], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    if (!xml.trim()) return {};
    const tmp = path.join(require('os').tmpdir(), `kitted-ent-${process.pid}.plist`);
    fs.writeFileSync(tmp, xml);
    try {
      return plistJson(tmp);
    } finally {
      fs.rmSync(tmp, { force: true });
    }
  } catch {
    return {};
  }
}

function main() {
  const args = process.argv.slice(2);
  const app = args.find((a) => !a.startsWith('--'));
  if (!app || !fs.existsSync(path.join(app, 'Info.plist'))) {
    console.error('Usage: npm run check:app -- <path to Kitted.app> [--paid]');
    process.exit(2);
  }
  const privacyFile = path.join(app, 'PrivacyInfo.xcprivacy');
  const problems = checkApp({
    info: plistJson(path.join(app, 'Info.plist')),
    privacy: fs.existsSync(privacyFile) ? plistJson(privacyFile) : null,
    entitlements: entitlementsOf(app),
    paid: args.includes('--paid'),
  });
  if (problems.length > 0) {
    console.error(`check:app FAILED for ${app}:`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(`check:app passed: ${app} (no dev launcher keys, the privacy manifest, ${args.includes('--paid') ? 'the paid' : 'no other paid'} entitlements, Sign in with Apple).`);
}

module.exports = { checkApp, REQUIRED_API_CATEGORIES, PAID_ENTITLEMENTS };
if (require.main === module) main();
