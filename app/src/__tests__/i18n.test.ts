import { en, t } from '@/i18n/en';

describe('i18n', () => {
  it('has the tab labels from the copy deck', () => {
    expect([t('tab.stylist'), t('tab.closet'), t('tab.lookbook'), t('tab.you')]).toEqual(['Stylist', 'Closet', 'Lookbook', 'You']);
  });

  it('fills arguments and picks the plural form', () => {
    expect(t('item.fits', { n: 37 })).toBe('+37 fits');
    expect(t('item.fits', { n: 1 })).toBe('+1 fit');
    expect(t('why.mistakes', { n: 1 })).toBe('1 mistake found');
  });

  it('never says "AI stylist" or "unlimited", and has no emoji', () => {
    const all = Object.values(en).join('\n');
    expect(all).not.toMatch(/AI stylist/i);
    expect(all).not.toMatch(/\bunlimited\b/i);
    expect(all).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
