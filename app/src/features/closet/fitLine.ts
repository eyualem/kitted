// The fit-check card's line for a "Not sure" piece (09-ui-review §19, #319; the bagginess debate's verdict): "Not sure
// about your mid-wash jeans' leg? Tap." It's a statement under the score, never a question before it (#122), and it
// shows whether or not a fix would move the score, so seeing it never says an answer pays. A tap opens "Not quite
// right?" straight on that piece's row, offering only the values its photos showed (plus this photo's read); that fix
// re-scores this check only (the scored-fix rule). It stops for a piece after one tap, or after 2 checks shown untapped.
// Pure.
import type { Garment } from '@kitted/core';
import type { ClosetItemRow, ClosetObservationRow, FitCheckRow } from '@/data/types';
import { t } from '@/i18n/en';
import { checkReads, doubtField, fitDoubt, readValue, type DoubtField } from './fitDoubt';
import { isAwaitingAnswer, isOwned } from './profile';

/** The kv key of the line's cap (this phone only). */
export const FIT_LINE_KEY = 'closet.fitLine';
/** Checks a line may show on without a tap before it stops for that piece. */
export const LINE_MAX_SHOWN = 2;

export type LineCap = Record<string, { checks: string[]; tapped: boolean }>;

export function parseLineCap(raw: string | null | undefined): LineCap {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as unknown;
    if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
    const out: LineCap = {};
    for (const [k, e] of Object.entries(v as Record<string, unknown>)) {
      const o = e as { checks?: unknown; tapped?: unknown };
      if (o && Array.isArray(o.checks)) out[k] = { checks: o.checks.filter((c): c is string => typeof c === 'string'), tapped: o.tapped === true };
    }
    return out;
  } catch {
    return {};
  }
}

/** May the line show for this piece on this check? A check it already showed on keeps it. */
export function lineAllowed(cap: LineCap, itemId: string, checkId: string): boolean {
  const c = cap[itemId];
  if (!c) return true;
  return !c.tapped && (c.checks.includes(checkId) || c.checks.length < LINE_MAX_SHOWN);
}
/** The cap after the line showed on this check (unchanged when it already counted). */
export function withShown(cap: LineCap, itemId: string, checkId: string): LineCap {
  const c = cap[itemId] ?? { checks: [], tapped: false };
  return c.checks.includes(checkId) ? cap : { ...cap, [itemId]: { ...c, checks: [...c.checks, checkId] } };
}
export function withTapped(cap: LineCap, itemId: string): LineCap {
  return { ...cap, [itemId]: { checks: cap[itemId]?.checks ?? [], tapped: true } };
}

export interface CardLine {
  itemId: string;
  garmentIndex: number;
  field: DoubtField;
  /** "Not sure about your mid-wash jeans' leg?" */
  lead: string;
  /** "Tap." */
  action: string;
  /** "Not quite right?" on that row, with only the values seen. */
  href: string;
}

const LEG_ORDER: readonly string[] = ['skinny', 'slim', 'straight', 'relaxed', 'wide'];
/** "mid-wash jeans'" / "black tee's" */
const owner = (name: string) => {
  const n = name.charAt(0).toLowerCase() + name.slice(1);
  return /s$/i.test(n) ? `${n}'` : `${n}'s`;
};
/** The field "Not quite right?" edits for a garment (fields.ts fitField), as a doubt field. */
const rowField = (g: Garment): DoubtField | null =>
  g.category === 'top' || g.category === 'outerwear' ? 'fit' : g.category === 'bottom' ? 'leg' : null;

/** The line a scored card shows, or null (§19.3 BX3). `garments`: the check's current reading. */
export function cardLine(
  row: Pick<FitCheckRow, 'id' | 'details'>, garments: readonly Garment[], items: readonly ClosetItemRow[],
  obs: readonly ClosetObservationRow[], cap: LineCap,
): CardLine | null {
  const links = (row.details.closetSummary?.links ?? []).filter((l) => l.origin === 'garment');
  const owned = items.filter(isOwned);
  for (const [i, g] of garments.entries()) {
    // "Not quite right?" has no row for these (CorrectSheet), so the line would open on nothing.
    if (g.certainty === 'unsure' || g.category === 'accessory') continue;
    const field = rowField(g);
    const link = links.find((l) => l.index === i);
    const item = link ? owned.find((c) => c.id === link.itemId) : undefined;
    if (!field || !item || isAwaitingAnswer(item, owned) || doubtField(item) !== field) continue;
    const d = fitDoubt(item, obs);
    if (!d || !lineAllowed(cap, item.id, row.id)) continue;
    const here = readValue(g, field);
    const seen = new Set([...checkReads(item.id, obs, field), ...(here !== null ? [here] : [])].map(String));
    const order = field === 'leg' ? LEG_ORDER : ['2', '3', '4', '5'];
    const only = order.filter((v) => seen.has(v));
    return {
      itemId: item.id, garmentIndex: i, field,
      lead: t(field === 'leg' ? 'closet.unsure.lineLeg' : 'closet.unsure.lineFit', { owner: owner(item.name) }),
      action: t('closet.unsure.lineTap'),
      href: `/sheets/correct/${row.id}?reason=detail&garment=${i}&only=${only.join(',')}`,
    };
  }
  return null;
}
