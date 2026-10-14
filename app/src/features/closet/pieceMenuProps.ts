// Props shared by the Closet piece menu's iOS (native long-press preview) and fallback versions.
import type { ClosetItemRow } from '@/data/types';
import type { PiecePreview } from './piecePreview';

export interface PieceMenuProps {
  item: ClosetItemRow;
  /** Tile width; height = width × aspect. */
  size: number;
  aspect?: number;
  radius?: number;
  /** What the long-press preview shows (piecePreviewSource). */
  preview: PiecePreview;
}
