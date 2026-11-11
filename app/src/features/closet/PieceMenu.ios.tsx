// A Closet piece (founder, Oct 14; #276): a tap opens its page; a long-press opens the native iOS context menu with a
// preview, like Photos. The preview is his real photo of the piece with the piece outlined and the rest dimmed
// (piecePreviewSource: his cover, else the best; cropped below his head, true-view for a mirror selfie; never the
// cut-out alone, #276), else the drawn tile, larger. Under it: Rename, then Remove from Closet (#118, with Undo).
// VoiceOver gets both as the tile's custom actions.
import { Button, ContextMenu, Host, Image, RNHostView, Rectangle, ZStack } from '@expo/ui/swift-ui';
import { background, border, clipShape, clipped, foregroundStyle, frame, offset, opacity, resizable, scaleEffect } from '@expo/ui/swift-ui/modifiers';
import { useTheme } from '@/design-system';
import { t } from '@/i18n/en';
import { ClosetTile } from './ClosetTile';
import { holdForMenu, MENU_HOLD_MS } from './menuHold';
import { openPiece, removePiece, renamePiece } from './pieceActions';
import type { PieceMenuProps } from './pieceMenuProps';
import { PREVIEW_MAX, previewFrame, type PiecePreview } from './piecePreview';

const RADIUS = 16;
/** SightingCrop's dimming (the same in light and dark: it sits on a photo). */
const DIM = '#080A10';
const DIM_OPACITY = 0.45;

function Preview({ preview, item }: { preview: PiecePreview; item: PieceMenuProps['item'] }) {
  const { colors } = useTheme();
  if (preview.kind === 'photo') {
    const f = previewFrame(preview.box, preview.aspect, preview.top);
    const W = f.width, H = f.height;
    // Each layer is sized, moved so its top-left sits at (x, y) in the frame, then given the frame's size (so the
    // ZStack never grows past the frame).
    const place = (x: number, y: number, w: number, h: number) => [
      frame({ width: Math.max(0, w), height: Math.max(0, h) }), offset({ x: x + w / 2 - W / 2, y: y + h / 2 - H / 2 }), frame({ width: W, height: H }),
    ];
    const p = f.piece;
    const dim = (x: number, y: number, w: number, h: number) =>
      w > 0 && h > 0 ? <Rectangle modifiers={[foregroundStyle(DIM), opacity(DIM_OPACITY), ...place(x, y, w, h)]} /> : null;
    return (
      <ZStack
        alignment="topLeading"
        modifiers={[frame({ width: W, height: H }), ...(preview.mirrored ? [scaleEffect({ x: -1, y: 1 })] : []), background(colors.surface2), clipShape('roundedRectangle', RADIUS)]}
      >
        <Image uiImage={preview.uri} modifiers={[resizable(), ...place(f.left, f.top, f.imgW, f.imgH), clipped()]} />
        {dim(0, 0, W, p.top)}
        {dim(0, p.bottom, W, H - p.bottom)}
        {dim(0, p.top, p.left, p.bottom - p.top)}
        {dim(p.right, p.top, W - p.right, p.bottom - p.top)}
        {/* a region wider than the frame (shoes): nothing above the piece (or his head) shows */}
        {f.hideAbove > 0 ? <Rectangle modifiers={[foregroundStyle(colors.surface2), ...place(0, 0, W, Math.ceil(f.hideAbove))]} /> : null}
        {/* the piece outlined, as on the piece page and the closet question */}
        <Rectangle modifiers={[foregroundStyle('#00000000'), border({ content: colors.ink2, width: 2 }), ...place(p.left, p.top, p.right - p.left, p.bottom - p.top)]} />
      </ZStack>
    );
  }
  return (
    <RNHostView matchContents>
      <ClosetTile item={item} size={PREVIEW_MAX - 60} aspect={1} radius={RADIUS} scale={0.78} decorative />
    </RNHostView>
  );
}

export function PieceMenu({ item, size, aspect, radius, preview, isNew }: PieceMenuProps) {
  const { scheme } = useTheme();
  return (
    <Host matchContents colorScheme={scheme} ignoreSafeArea="all">
      <ContextMenu>
        <ContextMenu.Trigger>
          <RNHostView matchContents>
            <ClosetTile
              item={item} size={size} aspect={aspect} radius={radius} label={item.name} isNew={isNew} onPress={() => openPiece(item)}
              // A hold is the menu's, never a tap on the page under it (menuHold.ts).
              onLongPress={holdForMenu} delayLongPress={MENU_HOLD_MS} accessibilityHint={t('closet.piece.a11y.tileHint')}
              actions={[
                { name: 'rename', label: t('closet.rename.action'), onAction: () => renamePiece(item) },
                { name: 'remove', label: t('closet.remove.action'), onAction: () => removePiece(item) },
              ]}
            />
          </RNHostView>
        </ContextMenu.Trigger>
        <ContextMenu.Preview>
          <Preview preview={preview} item={item} />
        </ContextMenu.Preview>
        <ContextMenu.Items>
          <Button label={t('closet.rename.action')} systemImage="pencil" onPress={() => renamePiece(item, { fromMenu: true })} />
          <Button label={t('closet.remove.action')} systemImage="minus.circle" role="destructive" onPress={() => removePiece(item)} />
        </ContextMenu.Items>
      </ContextMenu>
    </Host>
  );
}
