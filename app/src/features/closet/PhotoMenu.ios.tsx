// A photo on the piece page with its long-press menu (#276): the native iOS context menu, like the Closet tile's
// (PieceMenu.ios.tsx): Use as cover, Open the look, Not this piece, Remove photo (red). VoiceOver gets the same
// actions on the tile.
import { Button, ContextMenu, Host, RNHostView } from '@expo/ui/swift-ui';
import { useTheme } from '@/design-system';
import { holdForMenu, MENU_HOLD_MS } from './menuHold';
import { PiecePhotoTile, type PiecePhotoTileProps } from './PiecePhotoTile';

export function PhotoMenu(props: PiecePhotoTileProps) {
  const { scheme } = useTheme();
  return (
    <Host matchContents colorScheme={scheme} ignoreSafeArea="all">
      <ContextMenu>
        <ContextMenu.Trigger>
          <RNHostView matchContents>
            {/* A hold is the menu's, never a tap that opens the photo (menuHold.ts). */}
            <PiecePhotoTile {...props} onLongPress={holdForMenu} delayLongPress={MENU_HOLD_MS} />
          </RNHostView>
        </ContextMenu.Trigger>
        <ContextMenu.Items>
          {props.actions.map((a) => (
            <Button key={a.name} label={a.label} systemImage={a.systemImage} role={a.destructive ? 'destructive' : undefined} onPress={a.onAction} />
          ))}
        </ContextMenu.Items>
      </ContextMenu>
    </Host>
  );
}
