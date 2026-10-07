import { router } from 'expo-router';
import { clearStylistAction, getStylistAction, goToStylist } from '@/router/stylistAction';

jest.mock('expo-router', () => ({ router: { navigate: jest.fn() } }));

describe('stylistAction', () => {
  it('sets the action and switches to the Stylist tab, then clears', () => {
    goToStylist({ kind: 'styleItem', itemId: 'T3' });
    expect(getStylistAction()).toEqual({ kind: 'styleItem', itemId: 'T3' });
    expect(router.navigate).toHaveBeenCalledWith('/stylist');
    clearStylistAction();
    expect(getStylistAction()).toBeNull();
  });
});
