// WEB PREVIEW ONLY: no action sheet; a tap picks the first row.
import type { NeedChoice } from './needChoices';

export function openNeedMenu(_title: string, rows: readonly NeedChoice[], onPick: (c: NeedChoice) => void): void {
  if (rows[0]) onPick(rows[0]);
}
