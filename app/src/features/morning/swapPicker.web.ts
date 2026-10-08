// Web preview: no action sheet; swaps the last piece (layout checks only).
import type { ClosetItemRow } from '@/data/types';

export function pickSwap(items: readonly ClosetItemRow[], onPick: (itemId: string) => void): void {
  const last = items[items.length - 1];
  if (last) onPick(last.id);
}
