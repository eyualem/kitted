// A Closet piece outside iOS (the web preview): the tile; a tap opens its page (#276), Rename and Remove are
// VoiceOver-style actions only. The native long-press menu with his photo is PieceMenu.ios.tsx.
import { t } from '@/i18n/en';
import { ClosetTile } from './ClosetTile';
import { openPiece, removePiece, renamePiece } from './pieceActions';
import type { PieceMenuProps } from './pieceMenuProps';

export function PieceMenu({ item, size, aspect, radius, isNew }: PieceMenuProps) {
  return (
    <ClosetTile
      item={item} size={size} aspect={aspect} radius={radius} label={item.name} isNew={isNew} onPress={() => openPiece(item)} accessibilityHint={t('closet.piece.a11y.tileHint')}
      actions={[
        { name: 'rename', label: t('closet.rename.action'), onAction: () => renamePiece(item) },
        { name: 'remove', label: t('closet.remove.action'), onAction: () => removePiece(item) },
      ]}
    />
  );
}
