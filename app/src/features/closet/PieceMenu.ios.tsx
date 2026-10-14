// Long-press a Closet piece (founder, Oct 14): the native iOS context menu with a preview, like Photos. The preview is
// his own photo of the piece (piecePreviewSource: the measured cut-out, else his photo cropped to the piece with
// nothing above it, so no face), else the drawn tile, larger. Under it: Rename, then Remove from Closet (#118, with
// Undo). VoiceOver gets both as the tile's custom actions.
import { Button, ContextMenu, Host, Image, RNHostView, Rectangle, ZStack } from '@expo/ui/swift-ui';
import { background, clipShape, clipped, frame, offset, padding, resizable, aspectRatio, foregroundStyle } from '@expo/ui/swift-ui/modifiers';
import { useTheme } from '@/design-system';
import { t } from '@/i18n/en';
import { ClosetTile } from './ClosetTile';
import { removePiece, renamePiece } from './pieceActions';
import type { PieceMenuProps } from './pieceMenuProps';
import { PREVIEW_MAX, previewFrame, type PiecePreview } from './piecePreview';

const RADIUS = 16;

function Preview({ preview, item }: { preview: PiecePreview; item: PieceMenuProps['item'] }) {
  const { colors } = useTheme();
  if (preview.kind === 'cutout') {
    // only the piece's own pixels: shown whole on the tile color
    return (
      <Image
        uiImage={preview.uri}
        modifiers={[
          resizable(), aspectRatio({ contentMode: 'fit' }), frame({ width: PREVIEW_MAX - 40, height: PREVIEW_MAX - 40 }), padding({ all: 20 }),
          background(colors.surface2), clipShape('roundedRectangle', RADIUS),
        ]}
      />
    );
  }
  if (preview.kind === 'photo') {
    const f = previewFrame(preview.box, preview.aspect);
    // The image at its crop scale, moved so the piece's region sits where cropLayout puts it, then clipped to the frame.
    const dx = f.left + f.imgW / 2 - f.width / 2, dy = f.top + f.imgH / 2 - f.height / 2;
    return (
      <ZStack alignment="top" modifiers={[frame({ width: f.width, height: f.height }), background(colors.surface2), clipShape('roundedRectangle', RADIUS)]}>
        <Image
          uiImage={preview.uri}
          modifiers={[resizable(), frame({ width: f.imgW, height: f.imgH }), offset({ x: dx, y: dy }), frame({ width: f.width, height: f.height }), clipped()]}
        />
        {/* a region wider than the frame (shoes): nothing above the piece shows */}
        {f.hideAbove > 0 ? <Rectangle modifiers={[foregroundStyle(colors.surface2), frame({ width: f.width, height: Math.ceil(f.hideAbove) })]} /> : null}
      </ZStack>
    );
  }
  return (
    <RNHostView matchContents>
      <ClosetTile item={item} size={PREVIEW_MAX - 60} aspect={1} radius={RADIUS} scale={0.78} decorative />
    </RNHostView>
  );
}

export function PieceMenu({ item, size, aspect, radius, preview }: PieceMenuProps) {
  const { scheme } = useTheme();
  return (
    <Host matchContents colorScheme={scheme} ignoreSafeArea="all">
      <ContextMenu>
        <ContextMenu.Trigger>
          <RNHostView matchContents>
            <ClosetTile
              item={item} size={size} aspect={aspect} radius={radius} label={item.name}
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
