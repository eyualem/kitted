#!/usr/bin/env node
// npm run check:app -- <path to Kitted.app> [--paid] (09 §27 A3, #366): checks a built Release app (a local build, or an
// EAS .ipa unzipped: Payload/Kitted.app) before it goes to testers.
//   - Info.plist: none of the dev launcher's local-network keys or dev-menu keys (its build phase strips them outside Debug);
//   - PrivacyInfo.xcprivacy: every required-reason category the app declares (app.config.ts), no tracking;
//   - the entitlements: the paid team's four with --paid, none of them without;
//   - Google's sign-in can come back to the app: its URL scheme is registered (10-onboarding.md §12 SI10).
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

/** The reversed iOS client ID (app/src/config/firebase.ts GOOGLE_IOS_CLIENT_ID; app.config.ts's google-signin plugin). */
const GOOGLE_URL_SCHEME = 'com.googleusercontent.apps.1069635510987-h35362quu682rbpvvsdhqdkp4ic295v9';

/** Problems with a built app's plist, manifest and entitlements (parsed objects). Pure, for the tests. */
function checkApp({ info, privacy, entitlements, paid }) {
  const problems = [];
  if ((info.NSBonjourServices ?? []).some((s) => String(s).toLowerCase().startsWith('_expo._tcp'))) problems.push('Info.plist still lists the dev launcher\'s _expo._tcp Bonjour service');
  if (/Expo Dev Launcher/.test(String(info.NSLocalNetworkUsageDescription ?? ''))) problems.push('Info.plist still has the dev launcher\'s local-network string');
  for (const k of Object.keys(info)) if (/^(EXDevMenu|DEV_CLIENT_)/.test(k)) problems.push(`Info.plist has the dev key ${k}`);
  const schemes = (info.CFBundleURLTypes ?? []).flatMap((t) => t.CFBundleURLSchemes ?? []);
  if (!schemes.includes(GOOGLE_URL_SCHEME)) problems.push('Info.plist doesn\'t register Google sign-in\'s URL scheme, so its sheet can\'t return to the app');
  if (!privacy) problems.push('no PrivacyInfo.xcprivacy in the app');
  else {
    const have = new Set((privacy.NSPrivacyAccessedAPITypes ?? []).map((t) => t.NSPrivacyAccessedAPIType));
    for (const c of REQUIRED_API_CATEGORIES) if (!have.has(c)) problems.push(`PrivacyInfo.xcprivacy doesn't declare ${c}`);
    if (privacy.NSPrivacyTracking !== false) problems.push('PrivacyInfo.xcprivacy doesn\'t say NSPrivacyTracking = false');
    if ((privacy.NSPrivacyCollectedDataTypes ?? []).length === 0) problems.push('PrivacyInfo.xcprivacy declares no collected data');
  }
  for (const k of PAID_ENTITLEMENTS) {
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
  console.log(`check:app passed: ${app} (no dev launcher keys, the privacy manifest, ${args.includes('--paid') ? 'the paid' : 'no paid'} entitlements).`);
}

module.exports = { GOOGLE_URL_SCHEME, checkApp, REQUIRED_API_CATEGORIES, PAID_ENTITLEMENTS };
if (require.main === module) main();
