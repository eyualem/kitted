// The outfit card draws no "add a piece" tile (founder, Oct 28): the dashed "+" tiles for a missing layer, coat, top,
// bottoms or shoes did nothing when tapped, and he wants no add option on the card. The plan's missing slot stays in the
// data (core owns it); the card just doesn't draw it. A1–A3 render the strip; A4 checks the card passes it nothing to add.
import { fireEvent, render, screen } from '@testing-library/react-native';
import { HeroStrip } from '@/features/morning/HeroStrip';

// The strip alone: the design system pulls in Reanimated, which needs the native runtime.
jest.mock('@/design-system', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    KText: Text,
    Icon: ({ name }: { name: string }) => <Text>{`icon:${name}`}</Text>,
    useTheme: () => ({ colors: { surface2: '#EEE', line: '#DDD', inkFaint: '#999' }, isAccessibilitySize: false }),
  };
});
jest.mock('@/features/closet/GarmentArt', () => ({ PieceArt: () => null }));

declare const __dirname: string;
const { readFileSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');
const src = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');

const piece = (id: string, name: string) => ({ id, name }) as never;

async function strip(items: readonly never[], width = 301) {
  await render(<HeroStrip items={items} />);
  const root = screen.queryByTestId('hero-strip');
  if (root) await fireEvent(root, 'layout', { nativeEvent: { layout: { width, height: 0 } } });
  return root;
}

describe('the card draws no add tile', () => {
  test('A1: a 2-piece outfit draws its 2 pieces and nothing to add', async () => {
    await strip([piece('a', 'White tee'), piece('b', 'Dark jeans')]);
    expect(screen.getAllByLabelText(/^White tee|^Dark jeans/)).toHaveLength(2);
    expect(screen.queryByText('icon:plus')).toBeNull();
    expect(screen.queryByText(/You'd need|^A top$|^Bottoms$|^Shoes$/)).toBeNull();
  });

  test('A2: the pieces fill the strip (no room kept for a missing one)', async () => {
    await strip([piece('a', 'White tee'), piece('b', 'Dark jeans')], 301);
    const tile = screen.getAllByLabelText(/White tee/)[0];
    expect(tile.props.style).toMatchObject({ width: 150 }); // (301 − 1 hairline) / 2
  });

  test('A3: a closet with no pieces draws no strip at all', async () => {
    expect(await strip([])).toBeNull();
    expect(screen.queryByText('icon:plus')).toBeNull();
  });

  test('A4: the card hands the strip only real pieces', () => {
    const card = src('features/morning/MorningCard.tsx');
    const hero = src('features/morning/HeroStrip.tsx');
    expect(card).toMatch(/<HeroStrip items=\{enough \? m\.items : m\.known\} \/>/);
    expect(card).not.toMatch(/needs=/);
    expect(card).not.toMatch(/missingLabel/);
    expect(hero).not.toMatch(/dashed|missingLabel|"plus"|'plus'/);
  });
});
