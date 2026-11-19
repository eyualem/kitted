// A closet tile (C1 grid, S11 rows, the duplicate question): the detailed graphic on the tile color. A piece he owns
// but hasn't photographed is drawn the same, solid, with `No photo yet` under its name (a dashed tile means a piece he
// doesn't own, in Kit's cards). One VoiceOver element: the name and what's drawn.
import { Pressable, View } from 'react-native';
import { CONTROL_TEXT_MAX_SCALE, KText, opacity, useTheme } from '@/design-system';
import type { ClosetItemRow } from '@/data/types';
import { artSpec } from './artSpec';
import { GarmentArt } from './GarmentArt';
import { tileArtBox } from './tileArt';
import { t } from '@/i18n/en';

export interface ClosetTileProps {
  item: Pick<ClosetItemRow, 'garment' | 'hex' | 'art' | 'name' | 'isPhotographed'>;
  /** Tile width; height = width × aspect. */
  size: number;
  aspect?: number;
  radius?: number;
  /** Share of the tile the drawing takes (the flats carry their own margin; 02 C1's 62% was for the old icons). Shoes
   *  get more, on the tile's width (tileArt, §7 C4). */
  scale?: number;
  dim?: boolean;
  /** Draw the name under it. */
  label?: string | null;
  onPress?: () => void;
  /** Long-press (the piece's menu, #118); VoiceOver gets it as the custom action `longPressLabel`. */
  onLongPress?: () => void;
  longPressLabel?: string;
  /** How long a press must be held to be a long press (Pressable's own default is 500 ms). */
  delayLongPress?: number;
  /** VoiceOver custom actions without a press of its own (the Closet tile inside the native long-press menu). */
  actions?: readonly { name: string; label: string; onAction: () => void }[];
  accessibilityHint?: string;
  /** Inside a row that carries VoiceOver itself. */
  decorative?: boolean;
  /** His first Closet visit's pieces (SY2.8): a small `New` mark on the tile, and VoiceOver hears `New, {name}`. */
  isNew?: boolean;
}

export function ClosetTile({ item, size, aspect = 1, radius, scale = 0.8, dim, label, onPress, onLongPress, longPressLabel, delayLongPress, actions: own, accessibilityHint, decorative, isNew }: ClosetTileProps) {
  const { colors } = useTheme();
  const spec = artSpec(item);
  const noPhoto = item.isPhotographed === false;
  const h = Math.round(size * aspect);
  // Shoes get a bigger box than tops and pants, so they look as large (§7 C4).
  const art = tileArtBox(spec.shape, size, h, scale);
  // The line shows only where the tile carries its name; the small thumbnails in rows have none.
  const showNoPhoto = noPhoto && !!label;
  const named = showNoPhoto ? `${spec.a11y}, ${t('closet.tile.noPhoto').toLowerCase()}` : spec.a11y;
  const a11yLabel = isNew ? t('closet.new.a11y', { name: named }) : named;
  const body = (
    <View style={{ width: size, gap: label ? 6 : 0 }}>
      <View
        style={{
          width: size, height: h, borderRadius: radius ?? Math.round(size * 0.16), borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center',
          backgroundColor: colors.surface2, opacity: dim ? 0.4 : 1,
        }}
      >
        <View style={{ transform: [{ translateY: art.dy }] }}>
          <GarmentArt spec={spec} size={art.size} />
        </View>
        {isNew ? <NewMark /> : null}
      </View>
      {label ? (
        <View style={{ gap: 2 }}>
          <KText role="miniLabel" numberOfLines={2}>
            {label}
          </KText>
          {showNoPhoto ? (
            <KText variant="caption2" color="ink2" numberOfLines={2}>
              {t('closet.tile.noPhoto')}
            </KText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
  if (decorative) return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{body}</View>;
  if (!onPress && !onLongPress) {
    if (!own?.length) return <View accessible accessibilityLabel={a11yLabel}>{body}</View>;
    return (
      <View
        accessible accessibilityLabel={a11yLabel} accessibilityHint={accessibilityHint} accessibilityActions={own.map(({ name, label: l }) => ({ name, label: l }))}
        onAccessibilityAction={(e) => own.find((a) => a.name === e.nativeEvent.actionName)?.onAction()}
      >
        {body}
      </View>
    );
  }
  // A tap (the piece page, #276) can come with the tile's own custom actions (Rename, Remove).
  const actions = [
    ...(onLongPress && longPressLabel ? [{ name: 'longpress', label: longPressLabel }] : []),
    ...(own ?? []).map(({ name, label: l }) => ({ name, label: l })),
  ];
  const onAction = (name: string) => {
    if (name === 'longpress') onLongPress?.();
    else if (name === 'activate') onPress?.();
    else own?.find((a) => a.name === name)?.onAction();
  };
  return (
    <Pressable
      onPress={onPress} onLongPress={onLongPress} delayLongPress={delayLongPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={a11yLabel}
      accessibilityHint={accessibilityHint} accessibilityActions={actions.length > 0 ? actions : undefined} onAccessibilityAction={(e) => onAction(e.nativeEvent.actionName)}
      style={({ pressed }) => ({ opacity: pressed ? opacity.pressed : 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}
    >
      {body}
    </Pressable>
  );
}

/** `New` (SY2.8, tasks/T36 phone 2): ink on the card's surface, top left, not copper; not a control. */
function NewMark() {
  const { colors } = useTheme();
  return (
    <View style={{ position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: colors.surface }}>
      <KText variant="footnote" weight="600" color="ink" maxFontSizeMultiplier={CONTROL_TEXT_MAX_SCALE}>
        {t('closet.new')}
      </KText>
    </View>
  );
}
