// G2: one toast at a time; a newer toast replaces the old, and hiding an old one is a no-op.
import { getToast, hideToast, showToast } from '@/features/toast/toast';

describe('toast store', () => {
  it('shows one at a time; hiding a replaced toast leaves the new one', () => {
    const first = showToast('Logged for today.', () => {});
    expect(getToast()?.text).toBe('Logged for today.');
    const second = showToast('Correction saved.');
    hideToast(first);
    expect([getToast()?.text, getToast()?.undo]).toEqual(['Correction saved.', undefined]);
    hideToast(second);
    expect(getToast()).toBeNull();
  });
});
