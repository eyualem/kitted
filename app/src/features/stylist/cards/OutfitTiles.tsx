// The piece tiles (02 D12 / "S1d"; specs/kit-stylist-chat.md KC1.6, KC2.2): square tiles with a name under each. Kit's
// cards use one fixed tile size (76 pt, larger with bigger text) and are only as wide as their tiles: more tiles than fit
// wrap to the next row, and a card with two tiles is narrow. A piece he'd need is drawn on a dashed tile with
// `You'd need` under its name. The morning card's compact strip keeps its own width-based grid.
import { createContext, useContext, useState } from 'react';
import { Pressable, View } from 'react-native';
import { KText, useTheme } from '@/design-system';
import type { ClosetItemRow } from '@/data/types';
import { PieceArt } from '@/features/closet/GarmentArt';
import type { DrawnPieceSpec } from '@/features/closet/artSpec';

export const TILE_GAP = 8;
/** The tile's side at the default text size (KC1.6). */
export const TILE_PT = 76;

/** The tile side for a text scale: 76 pt, growing with the text up to 1.5x (so 2 or 3 still fit a row at the largest). */
export function tileSize(fontScale: number): number {
  return Math.round(TILE_PT * Math.min(1.5, Math.max(1, fontScale)));
}

/** How wide a row of `n` tiles is when at most `room` pt is free: as many columns as fit (at least 1), never more than
 *  `n`. A card is this wide, never stretched to the screen (KC1.6). */
export function tilesWidth(n: number, tile: number, room: number): number {
  if (n <= 0) return 0;
  const fit = room > 0 ? Math.max(1, Math.floor((room + TILE_GAP) / (tile + TILE_GAP))) : n;
  const cols = Math.min(n, fit);
  return cols * tile + (cols - 1) * TILE_GAP;
}

/** The width a card's content may use (the thread's width less the card's padding). AskAttachment measures it. */
export const CardRoom = createContext(0);

export type Tile =
  | { key: string; item: ClosetItemRow; label?: string; mark?: string | null; onPress?: () => void; hint?: string }
  | { key: string; piece: DrawnPieceSpec; label?: string; mark?: string | null; dashed?: boolean; onPress?: () => void; hint?: string };

/** Kit's card tiles at their fixed size (KC1.6). */
export function PieceTiles({ tiles }: { tiles: readonly Tile[] }) {
  const { colors, fontScale, isAccessibilitySize } = useTheme();
  const room = useContext(CardRoom);
  const side = tileSize(fontScale);
  return (
    <View testID="piece-tiles" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: TILE_GAP, width: tilesWidth(tiles.length, side, room) }}>
      {tiles.map((tile) => {
        const name = tile.label ?? ('item' in tile ? tile.item.name : tile.piece.name);
        const dashed = 'piece' in tile && tile.dashed === true;
        const art = (
          <View
            style={{
              width: side, height: side, borderRadius: 14, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center',
              ...(dashed ? { borderWidth: 1.5, borderStyle: 'dashed' as const, borderColor: colors.inkFaint } : { backgroundColor: colors.surface2 }),
            }}
          >
            {'item' in tile ? <PieceArt item={tile.item} size={Math.round(side * 0.8)} /> : <PieceArt item={tile.piece} size={Math.round(side * 0.8)} />}
          </View>
        );
        const words = (
          <View style={{ gap: 1 }}>
            <KText role="miniLabel" color="ink" numberOfLines={isAccessibilitySize ? 4 : 2}>
              {name}
            </KText>
            {tile.mark ? (
              <KText variant="caption2" color={dashed ? 'accent' : 'ink3'} style={{ fontWeight: '600' }} numberOfLines={2}>
                {tile.mark}
              </KText>
            ) : null}
          </View>
        );
        const spoken = tile.mark ? `${name}, ${tile.mark}` : name;
        return tile.onPress ? (
          <Pressable
            key={tile.key}
            style={({ pressed }) => ({ width: side, gap: 6, opacity: pressed ? 0.6 : 1 })}
            onPress={tile.onPress}
            accessibilityRole="button"
            accessibilityLabel={spoken}
            accessibilityHint={tile.hint}
            hitSlop={4}
          >
            {art}
            {words}
          </Pressable>
        ) : (
          <View key={tile.key} style={{ width: side, gap: 6 }} accessible accessibilityLabel={spoken}>
            {art}
            {words}
          </View>
        );
      })}
    </View>
  );
}

/** The morning card's compact strip (and old callers): his pieces on a width-based grid. */
export function OutfitTiles({ items, compact = false }: { items: readonly ClosetItemRow[]; compact?: boolean }) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  if (!compact) return <PieceTiles tiles={items.map((item) => ({ key: item.id, item }))} />;
  const cols = 6;
  const tile = width > 0 ? Math.floor((width - TILE_GAP * (cols - 1)) / cols) : 0;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: TILE_GAP }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {tile > 0
        ? items.map((it) => (
            <View key={it.id} style={{ width: tile, gap: 6 }}>
              <View style={{ width: tile, height: tile, borderRadius: 10, borderCurve: 'continuous', backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
                <PieceArt item={it} size={Math.round(tile * 0.8)} />
              </View>
            </View>
          ))
        : null}
    </View>
  );
}
