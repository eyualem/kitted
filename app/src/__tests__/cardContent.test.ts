// Card content from the fixtures: labels, summaries, evaluateCheck vs expected_scores.json → fixes.
import { partialLabel, type ClosetItem, type Reading, type Styles } from '@kitted/core';
import expected from '../../../handoff/fixtures/expected_scores.json';
import seed from '../../assets/seed.json';
import { demoReadingById } from '@/services/readingSource/demoReadings';
import { evaluateCheck } from '@/features/fitcheck/scoring';
import { garmentLabel, readingPill, whatIRead } from '@/features/fitcheck/labels';
import { t } from '@/i18n/en';
import type { OccasionKey } from '@/data/types';

const STYLES = expected.profile.styles as unknown as Styles;
const closet = seed.scenarios.full.closet as unknown as ClosetItem[];
const r = (id: string) => demoReadingById(id) as Reading;

describe('garment labels', () => {
  it('"What I read" for p01b matches the seed story', () => {
    expect(whatIRead(r('p01b'))).toEqual(seed.scenarios.firstRun.story.firstCheck.whatIRead);
  });
  it('reading pills: held layers read "Overshirt · in hand"', () => {
    const p = r('p01b');
    expect(readingPill(p.garments[0]!, false)).toBe('White tee');
    expect(readingPill(p.held_items![0]!, true)).toBe('Overshirt · in hand');
    expect(readingPill(p.garments[1]!, false)).toBe('Tan chinos');
    expect(readingPill(p.garments[2]!, false)).toBe('White leather sneakers');
  });
  it('khaki_beige chinos are "Khaki chinos"; s24 pieces', () => {
    expect(garmentLabel(closet.find((c) => c.id === 'B1')!.garment)).toBe('Khaki chinos');
    expect(r('s24').garments.map(garmentLabel)).toEqual(['Black sweatshirt', 'Black gym shorts']);
  });
});

// v4.1 engine tests (expected_scores.json and the seed's v4 summaries): pinned to engine 'v4' (#209).
describe('evaluateCheck vs expected_scores.json → fixes', () => {
  for (const c of expected.fixes) {
    it(c.id, () => {
      const ev = evaluateCheck({
        reading: r(c.reading), occasion: c.occasion as OccasionKey, styles: STYLES, boldness: null,
        closet: c.closet === 'empty' ? [] : closet, firstCheck: c.firstCheck === true, engine: 'v4',
      });
      expect(ev.scored?.overall).toBe(c.expected.base_overall);
      expect(ev.fixes.fixes.map((f) => [f.copy, f.tag, f.to])).toEqual(c.expected.fixes.map((f) => [f.copy, f.tag, f.to]));
      expect(ev.fixes.nextLevel).toEqual(c.expected.next_level);
      expect(ev.fixes.tips).toEqual(c.expected.tips);
      expect(ev.row.details.dialedIn).toBe(c.expected.fixes.length === 0);
    });
  }
});

describe('summaries', () => {
  const ev = (id: string, occasion: OccasionKey, full = true, firstCheck = false) =>
    evaluateCheck({ reading: r(id), occasion, styles: STYLES, boldness: null, closet: full ? closet : [], firstCheck, engine: 'v4' });
  it('p01b at Date: the mockup verdict', () => {
    expect(ev('p01b', 'date', false, true).summary).toBe(t('card.example.verdict'));
    expect(ev('p01b', 'date', false, true).summary).toBe(seed.scenarios.full.fitChecks[3]!.verdict);
  });
  it('s24 at Everyday: the partial summary from the deck and the seed', () => {
    expect(ev('s24', 'everyday').summary).toBe(t('partial.example.summary'));
    expect(ev('s24', 'everyday').summary).toBe(seed.scenarios.full.fitChecks[2]!.summary);
    expect(ev('s24', 'everyday').partial).toBe('shoes');
  });
  it('no fix: "Clean and finished" only at 9+, else no quick fixes (no "dialed in" on a 7.0)', () => {
    expect(ev('s24', 'gym').scored!.overall).toBe(7.0);
    expect(ev('s24', 'gym').summary).toContain(t('sum.noQuickFix'));
    expect(ev('s24', 'gym').summary).not.toContain('dialed');
  });
  it("core's partial label equals the deck string", () => {
    expect(partialLabel(['shoes'])).toBe(t('partial.label.shoes'));
    expect(partialLabel(['bottom half'])).toBe(t('partial.label.topOnly'));
  });
  it('an unclothed reading is not scored and saves nothing scored', () => {
    const p = r('p01b');
    const e = evaluateCheck({ reading: { ...p, scene: { ...p.scene, clothed: 'partial' } }, occasion: 'date', styles: STYLES, boldness: null, closet: [], firstCheck: false });
    expect([e.status, e.row.score]).toEqual(['notClothed', null]);
  });
});

describe('"Reads as" (02 "S6s", #85): the look the card names, from core styleLabel, on every re-score', () => {
  const readsAs = (id: string, styles: Styles = []) =>
    evaluateCheck({ reading: r(id), occasion: 'everyday', styles, boldness: null, closet: [], firstCheck: false }).row.details.readsAs;
  it('the demo set with no picks: minimal, smart casual or none', () => {
    expect(['p01a', 'p01b', 's25', 's14'].map((id) => readsAs(id))).toEqual(['minimalist', 'minimalist', 'minimalist', 'minimalist']);
    expect(['s10', 's15', 's22'].map((id) => readsAs(id))).toEqual(['smart_casual', 'smart_casual', 'smart_casual']);
    expect(['s05', 's09', 's12', 's13', 's24'].map((id) => readsAs(id))).toEqual([null, null, null, null, null]);
  });
  it('a pick breaks a tie between two looks that both fit (p01b: minimal and smart casual)', () => {
    expect(readsAs('p01b', [['smart_casual', 1]])).toBe('smart_casual');
    expect(readsAs('p01b', [['streetwear', 1]])).toBe('minimalist'); // a pick that doesn't fit changes nothing
    expect(readsAs('s05', [['minimalist', 1]])).toBeNull(); // and never invents a look
  });
  it('picks never change it into a score: same score with any style', () => {
    const a = evaluateCheck({ reading: r('s15'), occasion: 'everyday', styles: [['streetwear', 1]], boldness: null, closet: [], firstCheck: false });
    const b = evaluateCheck({ reading: r('s15'), occasion: 'everyday', styles: [], boldness: null, closet: [], firstCheck: false });
    expect(a.row.score).toBe(b.row.score);
  });
  it('an unscored reading reads as nothing', () => {
    const p = r('p01b');
    expect(evaluateCheck({ reading: { ...p, scene: { ...p.scene, clothed: 'partial' } }, occasion: 'date', styles: STYLES, boldness: null, closet: [], firstCheck: false }).row.details.readsAs).toBeNull();
  });
});
