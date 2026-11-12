// Looks · "Something else? Tell me in your words" (founder, Nov 11: a tester found it hard to type into). The keyboard
// covered the field and Continue (seen on the Simulator); the screen now rides the keyboard and scrolls the field into
// view (checked on the Simulator; the keyboard itself isn't rendered here). The field also closed on any blur, so a
// stray blur could make the tile look dead; once opened, it now stays until Done.
//
// Profile (CLAUDE.md rule 6): no photo is used. The words are typed in the test.
import { mockT39, mount, press, setUpT39Tests, typeIn } from '@/testing/t39ScreenMocks';
import { fireEvent, screen } from '@testing-library/react-native';
import { act } from 'react';
import { TextInput } from 'react-native';
import { PickLooksScreen } from '@/features/onboarding/PickLooksScreen';
import { OTHER_STYLE_KEY } from '@/features/onboarding/basics';

setUpT39Tests();

const TILE = 'Something else. Describe your style in your own words.';
const PLACEHOLDER = 'Like skater, or all black';

describe('Looks · in your own words', () => {
  it('a blur right after the tile opens the field does not take the field away', async () => {
    await mount(<PickLooksScreen />);
    expect(screen.queryByPlaceholderText(PLACEHOLDER)).toBeNull();
    await press(screen.getByRole('button', { name: TILE }));
    const field = screen.getByPlaceholderText(PLACEHOLDER);
    await act(async () => { fireEvent(field, 'blur'); });
    expect(screen.queryByPlaceholderText(PLACEHOLDER)).not.toBeNull();
  });

  it('the field takes focus once it opens from the tile', async () => {
    await mount(<PickLooksScreen />);
    await press(screen.getByRole('button', { name: TILE }));
    const field = screen.getByPlaceholderText(PLACEHOLDER);
    // autoFocus alone didn't hold on iOS; the screen focuses the field itself once it's on screen.
    expect(field.props.autoFocus).toBeFalsy();
    // The preset's TextInput mock shares one jest.fn `focus` on its prototype.
    const focus = (TextInput as unknown as { prototype: { focus: jest.Mock } }).prototype.focus;
    focus.mockClear();
    await act(async () => { jest.advanceTimersByTime(100); });
    expect(focus).toHaveBeenCalled();
  });

  it('typed words show on the tile and are saved with Continue', async () => {
    await mount(<PickLooksScreen />);
    await press(screen.getByRole('button', { name: TILE }));
    await typeIn(screen.getByPlaceholderText(PLACEHOLDER), '  old   money ');
    expect(screen.getByText('"old money"')).toBeTruthy();
    await act(async () => { fireEvent(screen.getByPlaceholderText(PLACEHOLDER), 'submitEditing'); });
    expect(screen.queryByPlaceholderText(PLACEHOLDER)).toBeNull();
    await press(screen.getByText('Continue'));
    expect(await mockT39.store.getKv(OTHER_STYLE_KEY)).toBe('old money');
  });
});
