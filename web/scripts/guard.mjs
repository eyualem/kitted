// Refuses a deploy while something the live page needs is missing (handoff/15-landing-page.md §7 step 9, §10).
// Run after `npm run check`: `npm run guard`. It can't see the server's WAITLIST_SECRET; the deploy steps set it.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const site = readFileSync(join(root, 'src/lib/site.ts'), 'utf8');
const missing = [];
const notes = [];

if (/supportEmail:\s*null/.test(site)) missing.push('the support email (web/src/lib/site.ts → supportEmail)');
if (!existsSync(join(root, 'dist/index.html'))) missing.push('a build (npm run check)');
if (!existsSync(join(root, 'public/og.png'))) missing.push('the link preview image (sh tools/web/og.sh)');
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
if (existsSync(join(root, 'dist'))) {
  for (const f of walk(join(root, 'dist')).filter((f) => f.endsWith('.html'))) {
    if (readFileSync(f, 'utf8').includes('not set yet')) missing.push(`a placeholder in ${f.replace(root, '')}`);
  }
}
if (!existsSync(join(root, 'public/hero/hero.mp4'))) notes.push('No hero video yet: the drawn example card shows instead (15 §10 ask 2).');

for (const n of notes) console.log(`note: ${n}`);
if (missing.length) {
  console.error(`Not ready to deploy. Missing:\n${missing.map((m) => `  - ${m}`).join('\n')}`);
  process.exit(1);
}
console.log('Ready to deploy.');
