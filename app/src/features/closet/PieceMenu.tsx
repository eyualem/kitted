// A Closet piece outside iOS (the web preview): the tile, with Rename and Remove as VoiceOver-style actions only.
// The native long-press menu with his photo is PieceMenu.ios.tsx.
import { t } from '@/i18n/en';
import { ClosetTile } from './ClosetTile';
import { removePiece, renamePiece } from './pieceActions';
import type { PieceMenuProps } from './pieceMenuProps';

export function PieceMenu({ item, size, aspect, radius }: PieceMenuProps) {
  return (
    <ClosetTile
      item={item} size={size} aspect={aspect} radius={radius} label={item.name}
      actions={[
        { name: 'rename', label: t('closet.rename.action'), onAction: () => renamePiece(item) },
        { name: 'remove', label: t('closet.remove.action'), onAction: () => removePiece(item) },
      ]}
    />
  );
}
