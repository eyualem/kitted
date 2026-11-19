// Looks · "Tell me in your words" (founder, Nov 11: a tester found it hard to type into). The keyboard covered the
// field and Continue (seen on the Simulator); the screen now rides the keyboard and scrolls the field into view (checked
// on the Simulator; the keyboard itself isn't rendered here). The field also closed on any blur, so a stray blur could
// make it look dead; once opened, it now stays until Done.
//
// T113 moved these three lessons from the old grid's "Something else?" tile to the style game's results, where his own
// words now live (specs/style-game.md SG5): `results-words-link` opens `results-words-input`. The checks are the same.
//
// Profile (CLAUDE.md rule 6): no photo is used. The words are typed in the test; the game is a fixed deal (seed 42) where
// he said Me to Minimal only (one look, Here's your style).
import { mockT39, mount, press, setUpT39Tests, typeIn } from '@/testing/t39ScreenMocks';
import { buttonIn, setUpGame } from '@/testing/styleGameTestKit';
import { fireEvent, screen } from '@testing-library/react-native';
import { act } from 'react';
import { TextInput } from 'react-native';
import { StyleGameScreen } from '@/features/onboarding/StyleGameScreen';
import { OTHER_STYLE_KEY } from '@/features/onboarding/basics';
import { endStyleGame } from '@/features/onboarding/styleGameSession';

setUpT39Tests();

const LINK = 'Not quite you? Tell me in your words';
const PLACEHOLDER = 'Like skater, or all black';

beforeEach(async () => {
  endStyleGame();
  await setUpGame(mockT39.store, { seed: 42, me: ['minimalist'] });
});
afterEach(() => {
  endStyleGame();
});

describe('Looks · in your own words', () => {
  it('a blur right after the link opens the field does not take the field away', async () => {
    await mount(<StyleGameScreen />);
    expect(screen.queryByPlaceholderText(PLACEHOLDER)).toBeNull();
    await press(screen.getByRole('button', { name: LINK }));
    const field = screen.getByPlaceholderText(PLACEHOLDER);
    await act(async () => { fireEvent(field, 'blur'); });
    expect(screen.queryByPlaceholderText(PLACEHOLDER)).not.toBeNull();
  });

  it('the field takes focus once it opens from the link', async () => {
    await mount(<StyleGameScreen />);
    await press(screen.getByRole('button', { name: LINK }));
    const field = screen.getByPlaceholderText(PLACEHOLDER);
    // autoFocus alone didn't hold on iOS; the screen focuses the field itself once it's on screen.
    expect(field.props.autoFocus).toBeFalsy();
    // The preset's TextInput mock shares one jest.fn `focus` on its prototype.
    const focus = (TextInput as unknown as { prototype: { focus: jest.Mock } }).prototype.focus;
    focus.mockClear();
    await act(async () => { jest.advanceTimersByTime(100); });
    expect(focus).toHaveBeenCalled();
  });

  it('typed words show once saved and are saved with Continue', async () => {
    await mount(<StyleGameScreen />);
    await press(screen.getByRole('button', { name: LINK }));
    await typeIn(screen.getByPlaceholderText(PLACEHOLDER), '  old   money ');
    await act(async () => { fireEvent(screen.getByPlaceholderText(PLACEHOLDER), 'submitEditing'); });
    expect(screen.queryByPlaceholderText(PLACEHOLDER)).toBeNull();
    expect(screen.getByText('In your words: "old money"')).toBeTruthy();
    await press(buttonIn('results-continue'));
    expect(await mockT39.store.getKv(OTHER_STYLE_KEY)).toBe('old money');
  });
});
