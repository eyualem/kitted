import type { Reading, Styles } from '@kitted/core';
import seed from '../../assets/seed.json';
import { demoReadingById } from '@/services/readingSource/demoReadings';
import { whyRows } from '@/features/why/ledgerRows';

const STYLES = seed.scenarios.firstRun.onboardingAnswers.styles as unknown as Styles;
const rowsOf = (id: string, occasion: 'date' | 'everyday') =>
  whyRows(demoReadingById(id) as Reading, occasion, STYLES, null)!.rows.map((r) => [r.rule, r.item ?? null, r.valueText ?? r.amount]);

describe('Why rows', () => {
  it('p01b at Date: the mockup ledger (screen 8)', () => {
    expect(rowsOf('p01b', 'date')).toEqual([
      ['Everyone starts at', null, '7.0'],
      ['Elevated piece', 'tan chinos', 0.5],
      ['Shoes that match', 'white leather sneakers', 0.5],
      ['Layered', 'the overshirt is in your hand, not on', 0],
      ['Point of interest', 'all neutrals today', 0],
      ['Date', 'dressed right for it', 0],
    ]);
  });
  it('p01a: a rounding row makes 8.75 add up to 9.0', () => {
    const r = whyRows(demoReadingById('p01a') as Reading, 'date', STYLES, null)!.rows;
    expect(r[r.length - 1]).toMatchObject({ rule: 'Rounded to the nearest half', amount: 0.25 });
  });
  it('s24 at Everyday: shoes not rated (no points lost), loungewear −0.6, no occasion row', () => {
    const rows = rowsOf('s24', 'everyday');
    expect(rows).toContainEqual(['Shoes', 'not in the photo, so no points lost', 0]);
    expect(rows).toContainEqual(['Loungewear outside the gym', 'black gym shorts', -0.6]);
    expect(rows.map((r) => r[1])).not.toContain('dressed right for it');
  });
});
