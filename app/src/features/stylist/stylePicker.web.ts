// Web preview: steps to the next style (layout checks only).
import { STYLES, type StyleKey } from '@/data/types';

export function pickStyle(current: StyleKey | null, onPick: (s: StyleKey) => void): void {
  const i = current ? STYLES.indexOf(current) : -1;
  onPick(STYLES[(i + 1) % STYLES.length]!);
}
