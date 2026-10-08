// The V5 style rename (#83): one list of keys, the same as the rubric's detected styles, with the old
// onboarding keys read as the new ones everywhere a style comes from storage or a route.
import { RUBRIC_DATA } from '@kitted/core';
import { normStyleKey, STYLES } from '@/data/types';
import { firstStyle } from '@/features/fitcheck/lens';
import { lensFromParams } from '@/features/camera/startCheck';
import { styleLabel } from '@/features/morning/copy';
import { en } from '@/i18n/en';

jest.mock('@/features/fitcheck/session', () => ({ fitCheck: {} }));
jest.mock('@/data/db', () => ({ store: {} }));

describe('style keys (V5)', () => {
  it('are exactly the rubric\'s detected styles', () => {
    expect([...STYLES].sort()).toEqual([...RUBRIC_DATA.styles.order].sort());
  });

  it('map the old keys and drop unknown ones', () => {
    expect(['preppy', 'old_money', 'gorpcore', 'streetwear', 'nope', null, 3].map(normStyleKey)).toEqual(
      ['classic_prep', 'classic_prep', 'outdoor', 'streetwear', null, null, null],
    );
    expect(firstStyle([['old_money', 1]])).toBe('classic_prep');
    expect(firstStyle([['gorpcore', 0.5], ['streetwear', 0.5]])).toBe('outdoor');
    expect(lensFromParams({ style: 'preppy', occasion: 'date' })).toEqual({ style: 'classic_prep', occasion: 'date' });
    expect(lensFromParams({ style: 'bogus' })).toEqual({});
  });

  it('every key has a name; the old names are gone', () => {
    expect(STYLES.map((s) => styleLabel(s))).toEqual(['Streetwear', 'Smart casual', 'Minimal', 'Workwear', 'Classic prep', 'Vintage sport', 'Outdoor']);
    expect(styleLabel('old_money' as never)).toBe('Classic prep');
    for (const k of ['style.preppy', 'style.old_money', 'style.gorpcore']) expect(k in en).toBe(false);
  });
});
