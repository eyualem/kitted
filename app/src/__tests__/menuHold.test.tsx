// A Closet tile under the native long-press menu (founder, Oct 17): letting go after the menu's haptic but before the
// menu showed opened the piece page. H1–H2 drive the real Pressable (press in, hold, let go); H3 checks both native menus
// give their tile the hold.
import { render, screen, userEvent } from '@testing-library/react-native';
import { ClosetTile } from '@/features/closet/ClosetTile';
import { holdForMenu, MENU_HOLD_MS } from '@/features/closet/menuHold';

// The tile alone: the design system pulls in Reanimated, which needs the native runtime.
jest.mock('@/design-system', () => {
  const { Text } = jest.requireActual('react-native');
  return { KText: Text, opacity: { pressed: 0.6 }, useTheme: () => ({ colors: { surface2: '#EEE', inkFaint: '#999' } }) };
});
jest.mock('@/features/closet/GarmentArt', () => ({ GarmentArt: () => null }));

declare const __dirname: string;
const { readFileSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');

const item = { garment: 'tee', hex: '#FFFFFF', art: null, name: 'White tee', isPhotographed: true } as never;

async function tile(onPress: () => void) {
  await render(<ClosetTile item={item} size={100} label="White tee" onPress={onPress} onLongPress={holdForMenu} delayLongPress={MENU_HOLD_MS} />);
  return screen.getByRole('button');
}

describe('menu hold', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('H1: a tap still opens the piece', async () => {
    const onPress = jest.fn();
    const el = await tile(onPress);
    await userEvent.setup({ advanceTimers: jest.advanceTimersByTime }).press(el);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('H2: letting go after the hold opens nothing', async () => {
    const onPress = jest.fn();
    const el = await tile(onPress);
    // The menu's haptic comes after MENU_HOLD_MS; the finger lifts before the menu is up.
    await userEvent.setup({ advanceTimers: jest.advanceTimersByTime }).longPress(el, { duration: MENU_HOLD_MS + 150 });
    expect(onPress).not.toHaveBeenCalled();
  });

  test('H3: both native menus hand the hold to their tile', () => {
    for (const f of ['PieceMenu.ios.tsx', 'PhotoMenu.ios.tsx']) {
      const s = readFileSync(join(__dirname, '..', 'features', 'closet', f), 'utf8');
      expect(s).toMatch(/onLongPress=\{holdForMenu\} delayLongPress=\{MENU_HOLD_MS\}/);
    }
  });

  test('H4: the hold is shorter than Pressable\'s own long press, longer than a tap', () => {
    expect(MENU_HOLD_MS).toBeLessThan(500);
    expect(MENU_HOLD_MS).toBeGreaterThanOrEqual(300);
  });
});
