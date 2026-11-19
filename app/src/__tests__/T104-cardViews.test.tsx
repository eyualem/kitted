// T104 · Kit's card views (specs/kit-stylist-chat.md): the logic behind what each card shows. Layout and words are
// checked in the PR's screenshots; these pin the rules a screenshot can't (which tile says what, the menu's rows, the
// fitted width, the spoken lines) and that "bracelet" never reaches him.
import { render, screen } from '@testing-library/react-native';
import { ADD_READY } from '@/features/ask/cardActions';
import {
  addStatus, buyPiece, buySpoken, cardControls, cardPiece, cardSpoken, colorPieces, colorsTitle, needMenuChoices, outfitTag, tileMark,
  type AskCard, type CardPiece,
} from '@/features/ask/cards';
import { needMenuRows } from '@/features/ask/needChoices';
import { en } from '@/i18n/en';

jest.mock('@/design-system', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    KText: Text,
    useTheme: () => ({ colors: { surface2: '#EEE', inkFaint: '#999' }, fontScale: 1, isAccessibilitySize: false }),
  };
});
jest.mock('@/features/closet/GarmentArt', () => ({ PieceArt: () => null }));

// eslint-disable-next-line import/first -- after the mocks
import { CardRoom, PieceTiles, tilesWidth, tileSize, TILE_PT } from '@/features/stylist/cards/OutfitTiles';

const p = (kind: string, color: string, name: string): CardPiece => ({ kind, color, name });
const shirt = p('oxford_shirt', 'off_white_cream', 'Off-white oxford');
const outfit = (o: Partial<Extract<AskCard, { type: 'outfit' }>> = {}): Extract<AskCard, { type: 'outfit' }> => ({
  type: 'outfit', occasion: 'date', itemIds: ['L2', 'B3', 'S4'], needs: [shirt], example: false, ...o,
});
const names: Record<string, string> = { L2: 'Olive overshirt', B3: 'Dark jeans', S4: 'Black Chelsea boots', L3: 'Denim jacket' };
const words = { nameOf: (id: string) => names[id] ?? null };

describe('KC2.2 · a piece he would need', () => {
  it("the tag reads From your closet + n, and a drawn tile says You'd need", () => {
    expect(outfitTag(outfit(), 'Date')).toEqual({ left: 'Date', right: 'From your closet + 1' });
    expect(outfitTag(outfit({ needs: [shirt, p('belt', 'black', 'Black belt')] }), 'Date').right).toBe('From your closet + 2');
    expect(tileMark(outfit(), false)).toBe("You'd need");
  });
  it('his own pieces carry their names alone, and an outfit with nothing drawn says From your closet', () => {
    expect(tileMark(outfit(), true)).toBeNull();
    expect(outfitTag(outfit({ needs: [] }), 'Date').right).toBe('From your closet');
  });
  it("a drawn piece is never Yours (options too)", () => {
    const opts: AskCard = { type: 'options', slot: 'outer', options: [{ itemId: 'L3' }, { piece: p('chore_coat', 'charcoal', 'Charcoal chore coat') }] };
    expect(tileMark(opts, false)).toBe("You'd need");
    expect(tileMark(opts, true)).toBe('Yours');
    expect(cardSpoken(opts, words)).toBe("Options: denim jacket, yours; charcoal chore coat, you'd need.");
  });
});

describe('KC2.3 · an Example', () => {
  const ex = outfit({ itemIds: [], example: true, needs: [p('sweater', 'grey', 'Grey sweater'), p('jeans', 'denim_dark', 'Dark wash jeans')] });
  it('is titled Example, with the occasion on the right and never From your closet', () => {
    const tag = outfitTag(ex, 'Class');
    expect(tag).toEqual({ left: 'Example', right: 'Class' });
    expect(`${tag.left} ${tag.right}`).not.toMatch(/From your closet/);
  });
  it("no tile says Yours or You'd need, and there is no Wear this or need menu", () => {
    expect(tileMark(ex, false)).toBeNull();
    const c = cardControls(ex, { readOnly: false, tapped: null });
    expect(c.wear).toBe(false);
    expect(c.needMenu).toBe(false);
    expect(cardSpoken(ex, words)).toBe('Example: grey sweater, dark wash jeans.');
  });
});

describe("KC2.10 (the tile) · the You'd need menu", () => {
  it('offers Next buy when the kind has a Starter entry', () => {
    const c = needMenuChoices(p('overshirt', 'olive', 'Olive overshirt'), null, false);
    expect(c.nextBuy).toMatch(/^s\d+$/);
    expect(needMenuRows(c)).toEqual(['nextBuy']);
  });
  it('offers nothing for a kind with no Starter entry until I have one exists (the tile is not a button)', () => {
    expect(needMenuRows(needMenuChoices(p('watch', 'black', 'Black watch'), null, ADD_READY))).toEqual([]);
  });
  it('with the add built (T106), I have one comes first; with no Starter entry it is the only row', () => {
    expect(needMenuRows(needMenuChoices(p('overshirt', 'olive', 'Olive overshirt'), null, true))).toEqual(['haveOne', 'nextBuy']);
    expect(needMenuRows(needMenuChoices(p('watch', 'black', 'Black watch'), null, true))).toEqual(['haveOne']);
  });
  it('I have one stays out of the menu until T106 builds it (an outfit card can reach a tester before then)', () => {
    expect(ADD_READY).toBe(false);
  });
  it('the menu is live only: never in Past chats', () => {
    expect(cardControls(outfit(), { readOnly: false, tapped: null }).needMenu).toBe(true);
    expect(cardControls(outfit(), { readOnly: true, tapped: null }).needMenu).toBe(false);
  });
});

describe('KC1.6 · a card fits its content', () => {
  it('tiles are one fixed size, larger with bigger text', () => {
    expect(tileSize(1)).toBe(TILE_PT);
    expect(tileSize(0.85)).toBe(TILE_PT);
    expect(tileSize(1.3)).toBe(Math.round(TILE_PT * 1.3));
    expect(tileSize(1.8)).toBe(Math.round(TILE_PT * 1.8));
    expect(tileSize(3.1)).toBe(TILE_PT * 2);
  });
  it('two tiles make a narrow card; more than fit wrap; never wider than the room', () => {
    expect(tilesWidth(2, 76, 330)).toBe(160);
    expect(tilesWidth(3, 76, 330)).toBe(244);
    expect(tilesWidth(6, 76, 330)).toBe(4 * 76 + 3 * 8);
    expect(tilesWidth(6, 152, 328)).toBe(2 * 152 + 8);
    expect(tilesWidth(1, 152, 50)).toBe(152);
  });
  it('the tile row takes exactly that width', async () => {
    await render(
      <CardRoom.Provider value={330}>
        <PieceTiles tiles={[{ key: 'a', piece: { kind: 'oxford_shirt', family: 'white', name: 'White oxford' }, label: 'White' }, { key: 'b', piece: { kind: 'oxford_shirt', family: 'light_blue', name: 'Light blue oxford' }, label: 'Light blue' }]} />
      </CardRoom.Provider>,
    );
    expect(screen.getByTestId('piece-tiles').props.style).toMatchObject({ width: 160 });
  });
  it("a dashed tile shows its name and You'd need; an example tile shows its name alone", async () => {
    await render(
      <PieceTiles
        tiles={[
          { key: 'a', piece: { kind: 'oxford_shirt', family: 'white', name: 'White oxford' }, dashed: true, mark: tileMark(outfit(), false) },
          { key: 'b', piece: { kind: 'sweater', family: 'grey', name: 'Grey sweater' }, mark: tileMark(outfit({ example: true }), false) },
        ]}
      />,
    );
    expect(screen.getByLabelText("White oxford, You'd need")).toBeTruthy();
    expect(screen.getByLabelText('Grey sweater')).toBeTruthy();
    expect(screen.getAllByText("You'd need")).toHaveLength(1);
  });
});

describe('KC3.1, KC3.2, KC3.4 · colors', () => {
  const piece: AskCard = { type: 'colors', about: 'piece', kind: 'oxford_shirt', families: ['off_white_cream', 'light_blue'] };
  const general: AskCard = { type: 'colors', about: 'general', goesWith: 'olive', families: ['off_white_cream', 'tan_camel', 'brown'] };
  it('about a piece: the piece drawn once per color, each named', () => {
    const drawn = colorPieces(piece as Extract<AskCard, { type: 'colors' }>);
    expect(drawn.map((d) => [d.kind, d.color])).toEqual([['oxford_shirt', 'off_white_cream'], ['oxford_shirt', 'light_blue']]);
    expect(colorsTitle(piece as Extract<AskCard, { type: 'colors' }>)).toMatch(/^Colors for the /);
  });
  it('in general: Goes with olive', () => {
    expect(colorsTitle(general as Extract<AskCard, { type: 'colors' }>)).toBe('Goes with olive');
  });
  it('every color is said by its name (never the color alone)', () => {
    expect(cardSpoken(piece, words)).toMatch(/off-white, light blue\.$/);
    expect(cardSpoken(general, words)).toBe('Goes with olive: off-white, tan, brown.');
  });
});

describe('KC4.2 (the card) · the add card', () => {
  const add = (outcome: 'asked' | 'added' | 'declined'): Extract<AskCard, { type: 'add' }> => ({ type: 'add', piece: p('button_up_shirt', 'off_white_cream', 'Off-white button-up'), outcome, itemId: null });
  it('asks, with Add and No thanks, while it asks', () => {
    expect(addStatus(add('asked'), false)).toBe('Want me to add this to your closet?');
    const c = cardControls(add('asked'), { readOnly: false, tapped: null });
    expect([c.add, c.noThanks, c.undo]).toEqual([true, true, false]);
  });
  it('then says Added to Closet with Undo, or Not added', () => {
    expect(addStatus(add('added'), false)).toBe('Added to Closet');
    expect(cardControls(add('added'), { readOnly: false, tapped: null }).undo).toBe(true);
    expect(addStatus(add('declined'), false)).toBe('Not added');
  });
  it('Past chats show the outcome only, with no buttons (KC1.5); a card never answered shows the piece alone (#493)', () => {
    expect(addStatus(add('added'), true)).toBe('Added');
    expect(addStatus(add('declined'), true)).toBe('Not added');
    expect(addStatus(add('asked'), true)).toBeNull();
    expect(cardSpoken(add('asked'), { ...words, readOnly: true })).toBe('Off-white button-up.');
    const c = cardControls(add('asked'), { readOnly: true, tapped: null });
    expect([c.add, c.noThanks, c.undo]).toEqual([false, false, false]);
    expect(cardSpoken(add('added'), { ...words, readOnly: true })).toBe('Off-white button-up. Added.');
  });
});

describe('KC6.4 · the drawn buy card', () => {
  const buy: Extract<AskCard, { type: 'buy' }> = { type: 'buy', starterId: 's07', gain: 6, why: 'Layers over every top you own.' };
  it('draws the Starter pick in its color', () => {
    const piece = buyPiece(buy);
    expect(piece).not.toBeNull();
    expect(piece!.name.length).toBeGreaterThan(0);
  });
  it('says no outfit count while Outfits are off (the beta)', () => {
    expect(buySpoken(buy, false)).not.toMatch(/outfit/);
    expect(buySpoken(buy, true)).toMatch(/\+6 outfits/);
  });
});

describe('every new card has a VoiceOver line', () => {
  it('options, colors, add, changed and an outfit with drawn pieces', () => {
    const fields = (name: string) => ({ name, slot: 'shoes' as const, garment: {} as never, hex: '#000', confirmedFields: [] });
    const changed: AskCard = { type: 'changed', itemId: 'S4', before: fields('Brown Chelsea boots'), after: fields('Black Chelsea boots') };
    expect(cardSpoken(changed, words)).toBe('Black Chelsea boots. Changed.');
    expect(cardSpoken({ ...changed, undone: true }, words)).toBe('Brown Chelsea boots. Changed back.');
    expect(cardSpoken(outfit(), words)).toBe("From your closet + 1: olive overshirt, dark jeans, black Chelsea boots. You'd need: off-white oxford.");
  });
});

describe('"bracelet" never reaches him (the founder, Nov 17)', () => {
  it('no app string says it', () => {
    const hits = Object.entries(en).filter(([, v]) => typeof v === 'string' && /bracelet/i.test(v));
    expect(hits).toEqual([]);
  });
  it('no drawn watch is named or spoken with it, in any color', () => {
    const families = ['white', 'off_white_cream', 'grey', 'black', 'navy', 'brown', 'tan_camel', 'olive', 'burgundy', 'yellow', 'multicolor'];
    for (const f of families) {
      for (const kind of ['watch', 'gold watch', 'silver watch with a metal band', 'metal bracelet watch']) {
        const piece = cardPiece(kind, f);
        if (!piece) continue;
        expect(piece.name).not.toMatch(/bracelet/i);
        const card: AskCard = { type: 'outfit', occasion: 'date', itemIds: [], needs: [piece], example: false };
        expect(cardSpoken(card, words)).not.toMatch(/bracelet/i);
        expect(cardSpoken({ type: 'add', piece, outcome: 'asked', itemId: null }, words)).not.toMatch(/bracelet/i);
      }
    }
  });
});
