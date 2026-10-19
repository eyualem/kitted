// The Oct 12 copy fixes the founder OK'd on Oct 19 (DECISIONS-LOG #233, #347; 09-ui-review §22.8, checks W1–W6,
// written before the change). User-facing words only: keys and field names (`proportions`, `leg_shape`) stay.
import { PARTS_DATA, PARTS_FIXES_DATA, RUBRIC_DATA } from '@kitted/core';
import { en, t } from '@/i18n/en';

declare const __dirname: string;
const { readFileSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');
const src = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');
const core = (p: string) => readFileSync(join(__dirname, '../../packages/kitted-core/src', p), 'utf8');
const fixture = (p: string) => readFileSync(join(__dirname, '../../../handoff/fixtures', p), 'utf8');

const words = Object.values(en as Record<string, string>);
/** The string literals in a source file, comments left out. */
const literals = (code: string) =>
  code.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).flatMap((l) => l.match(/(["'`])(?:(?!\1).)*\1/g) ?? []);

describe('W1 · "How I score" explains the five parts', () => {
  it('names the five parts, and no credits, elevated piece or point of interest', () => {
    const how = ['why.how.body1', 'why.how.body2', 'why.how.body3', 'why.how.body4', 'why.how.body5'].map((k) => t(k as never)).join(' ');
    expect(how).toContain('Shape, Fit, Color, Shoes and Style');
    expect(how).toContain('Each starts at 7');
    for (const old of ['Credits', 'credit', 'elevated piece', 'point of interest', 'Everyone starts at 7.0']) expect(how).not.toContain(old);
  });
  it('its ✕ closes the sheet; a link on top goes back to Why', () => {
    const sheet = src('features/why/WhySheet.tsx');
    expect(sheet).toMatch(/<SheetScaffold title=\{t\('why\.how\.title'\)\}>/);
    expect(sheet).not.toMatch(/onClose=\{\(\) => setHow\(false\)\}/);
    expect(sheet).toMatch(/title=\{`‹ \$\{t\('why\.title', \{ score: displayScore\(score\) \}\)\}`\}[^\n]*onPress=\{\(\) => setHow\(false\)\}/);
  });
});

describe('W2 · reason and tip lines say pants, never legs', () => {
  it('no parts-engine line, fix catalog line or v4 tip copy says "legs"', () => {
    const lines = literals(core('parts.ts')).filter((s) => /\blegs\b/.test(s));
    expect(lines).toEqual([]);
    expect(Object.values(RUBRIC_DATA.fixes.tips).filter((s) => /\blegs\b/.test(s))).toEqual([]);
    expect(JSON.stringify(PARTS_FIXES_DATA)).not.toMatch(/\blegs\b/);
    // The engine's expected output (from parts_proto.py) agrees: no "legs" in any reason, tip or lowest-part line.
    expect(fixture('parts_parity.json')).not.toMatch(/ legs\b/);
    expect(literals(core('parts.ts'))).toContain('"a roomy top over skinny pants"');
  });
});

describe('W3 · face blurred, never cropped out', () => {
  it('no word in the app says cropped out or face-free', () => {
    expect(words.filter((s) => /cropped out|face-free/i.test(s))).toEqual([]);
    expect(t('onb.consent.sent1')).toMatch(/face blurred first/);
    expect(t('noConsent.body', { provider: 'P' })).toBe('To score a photo, I need your OK to send a copy with your face blurred to P.');
    expect(t('plist.NSCameraUsageDescription' as never)).toBe('Kitted uses the camera to check your outfit. Faces are blurred before anything is sent.');
    expect(readFileSync(join(__dirname, '../../app.config.ts'), 'utf8')).toContain("'Kitted uses the camera to check your outfit. Faces are blurred before anything is sent.'");
  });
});

describe('W4 · Welcome promises the fix', () => {
  it('"the fix that raises it"', () => {
    expect(t('onb.welcome.body')).toBe('Send a fit. Get a score out of 10 and the fix that raises it.');
  });
});

describe('W5 · Shape, never Proportions, wherever a part is named', () => {
  it('the part is shown as Shape; its key stays proportions', () => {
    expect(PARTS_DATA.partNames.proportions).toBe('Shape');
    expect(words.filter((s) => s.includes('Proportions'))).toEqual([]);
    expect(JSON.stringify(PARTS_FIXES_DATA)).not.toContain('Proportions');
    expect(fixture('parts_parity.json')).not.toMatch(/"Proportions \d/);
  });
});

describe('W6 · the frame failure says why nothing was sent', () => {
  it('the card and the camera panel', () => {
    const line = "I couldn't find your face to blur it, so I didn't send it. Get your head in the shot and try again.";
    expect(t('cam.retake.cantFrame')).toBe(line);
    expect(t('fail.cantFrame' as never)).toBe(line);
  });
});
