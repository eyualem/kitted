// L2 · the Lookbook look page (02 L2; 09-ui-review §1 item 12, §6.4; #280). One read-only model the page draws: the
// look's photo (neck-down; a tap opens the full viewer), its score and word exactly as stored, the date and occasion,
// the stored fixes in the card's words, its pieces as drawn tiles (each opens its piece page) and "Show in chat".
// A re-checked look shows the re-check (its photo, score and caught fixes) with the first score as "before".
// Read-only (K4): nothing here writes, and the page offers no occasion change, re-score, re-check or "Not quite right?".
import { router } from 'expo-router';
import type { ZoneOffset } from '@kitted/core';
import type { KittedStore } from '@/data/store';
import type { ChatMessage, ClosetItemRow, FitCheckRow } from '@/data/types';
import { shownPhoto, type ShownPhoto } from '@/demo/demoPhotos';
import { displayScore, scoreWordLabel, spokenScoreLine } from '@/design-system/score';
import { tipLeadText } from '@/features/fitcheck/scoring';
import { occasionLabel } from '@/features/stylist/thread';
import { t } from '@/i18n/en';
import { longDate } from '@/i18n/format';
import { goToStylist } from '@/router/stylistAction';
import { canShare } from '@/features/share/shareModel';
import { SHARE_CARD_BUILT } from '@/config/features';

/** What a tap on the page can do. Nothing that changes the check (K4). */
export type LookAction = 'photo' | 'before' | 'piece' | 'chat';

export interface LookFixRow {
  number: number;
  title: string;
  detail: string | undefined;
  /** "→ 7.0" as on the card; '' on a caught fix (the delta's pill carries the number). */
  gain: string;
  done: boolean;
}

export interface LookPiece {
  id: string;
  name: string;
  item: ClosetItemRow;
  href: string;
}

export interface LookPageModel {
  /** The look's first check (the Lookbook row's id). */
  checkId: string;
  /** The check whose photo and score show: its latest re-check, else the check. */
  shownId: string;
  /** "Date · October 22" (the viewer's and the Lookbook row's words). */
  title: string;
  occasion: string;
  date: string;
  /** The tagline: "Fit check · Full" / "Re-check · Partial". */
  tag: string;
  score: number;
  scoreText: string;
  word: string;
  /** VoiceOver: "Score was 8, now 9 out of 10, Dialed in." */
  scoreA11y: string;
  before: { score: number; scoreText: string; photo: ShownPhoto | null; href: string | null } | null;
  partialLabel: string | null;
  partialDone: boolean;
  summary: string | null;
  photo: ShownPhoto | null;
  /** The full viewer on the shown check; null when there's no photo (it never opens an empty viewer, K3). */
  photoHref: string | null;
  fixes: LookFixRow[];
  /** "This is dialed in. Nothing to fix." / "No quick fixes for this one." when there are no fix rows (and the summary doesn't say it). */
  noFixLine: string | null;
  tip: { lead: string; text: string } | null;
  pieces: LookPiece[];
  chatMessageId: string | null;
  actions: LookAction[];
  /** The check the share card opens on (the shown one: a re-checked look's re-check, so Before · After · Change), or
   *  null when it can't be shared (#352; the screen also asks shareNativeReady). */
  shareId: string | null;
}

/** The card's own nudge to change the occasion (`sum.lounge`'s second sentence): the page can't change it, so it goes (#282). */
const OCCASION_NUDGE = t('sum.lounge', { bottoms: '' }).split('. ').slice(1).join('. ');

/** The stored summary minus any line that asks for something this read-only page can't do. */
export function readOnlySummary(summary: string | null): string | null {
  if (!summary || !OCCASION_NUDGE) return summary;
  const out = summary.replace(OCCASION_NUDGE, '').replace(/\s{2,}/g, ' ').trim();
  return out || null;
}

export function lookHref(checkId: string): string {
  return `/lookbook/look/${checkId}`;
}

/** A Lookbook row: the look's page (K1), never the bare photo. */
export function openLookPage(checkId: string): void {
  router.push(lookHref(checkId) as never);
}

/** "Show in chat": the Stylist tab, scrolled to the look's card (an earlier day's card opens that day's chat). */
export function showInChat(look: Pick<LookPageModel, 'chatMessageId'>): void {
  if (look.chatMessageId) goToStylist({ kind: 'scrollTo', messageId: look.chatMessageId });
}

const SLOT_ORDER: readonly string[] = ['outer', 'top', 'bottom', 'shoes'];

/** The look's closet pieces: a merged piece goes to the one it was folded into; removed pieces are left out. */
function piecesOf(ids: readonly string[], closet: readonly ClosetItemRow[]): LookPiece[] {
  const byId = new Map(closet.map((c) => [c.id, c]));
  const out: LookPiece[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    let it = byId.get(id);
    for (let hops = 0; it?.mergedInto && hops < 8; hops++) it = byId.get(it.mergedInto);
    if (!it || it.isDeleted || seen.has(it.id)) continue;
    seen.add(it.id);
    out.push({ id: it.id, name: it.name, item: it, href: `/closet/item/${it.id}` });
  }
  const rank = (p: LookPiece) => {
    const i = SLOT_ORDER.indexOf(p.item.slot);
    return i < 0 ? SLOT_ORDER.length : i;
  };
  return out.sort((a, b) => rank(a) - rank(b));
}

/** The fix rows as the card words them: each stored fix once (#42), its copy, its tag, "→ 7.0". A re-check lists the
 *  fixes it caught first, done. */
function fixRows(shown: FitCheckRow): LookFixRow[] {
  const done = (shown.parentId ? shown.details.recheck?.doneFixes ?? [] : []).map((d) => d.copy);
  const open = shown.fixes.filter((f, i, all) => all.findIndex((g) => g.copy === f.copy) === i && !done.includes(f.copy));
  return [
    ...done.filter((c, i) => done.indexOf(c) === i).map((copy) => ({ title: copy, detail: undefined, gain: '', done: true })),
    ...open.map((f) => ({ title: f.copy, detail: f.tag ?? undefined, gain: t('card.gainTo', { score: displayScore(f.to) }), done: false })),
  ].map((r, i) => ({ number: i + 1, ...r }));
}

function partialOf(row: FitCheckRow): { label: string | null; done: boolean } {
  const finished = !row.isPartial && (row.snapState === 'snapped' || row.snapState === 'closetPick');
  if (finished) return { label: t(row.snapState === 'closetPick' ? 'partial.fullCloset' : 'partial.full'), done: true };
  if (!row.isPartial) return { label: null, done: false };
  return { label: row.notRated.includes('bottom half') ? t('partial.label.topOnly') : t('partial.label.shoes'), done: false };
}

/** The page's model from the stored rows (pure). */
export function buildLook(check: FitCheckRow, rechecks: readonly FitCheckRow[], closet: readonly ClosetItemRow[], chat: readonly ChatMessage[], zone: ZoneOffset): LookPageModel | null {
  if (check.status !== 'scored' || check.score === null) return null;
  const latest = rechecks.filter((r) => r.parentId === check.id && r.status === 'scored' && r.score !== null).sort((a, b) => b.createdAt - a.createdAt)[0];
  const shown = latest ?? check;
  const score = shown.score!;
  const occasion = occasionLabel(check.occasion);
  const date = longDate(check.createdAt, zone);
  const photo = shownPhoto(shown.demoPhotoId, shown.photoFile, undefined) ?? null;
  const firstPhoto = latest ? shownPhoto(check.demoPhotoId, check.photoFile, undefined) ?? null : null;
  const fixes = fixRows(shown);
  const partial = partialOf(shown);
  const quietNoFix = score < 9 && !!shown.explanation?.includes(t('sum.noQuickFix'));
  const noFixLine = fixes.length > 0 || quietNoFix ? null : score >= 9 ? t('dialed.title') : t('card.noFixes');
  const nextLevel = shown.details.nextLevel?.[0];
  const pieces = piecesOf(shown.itemIds.length > 0 ? shown.itemIds : check.itemIds, closet);
  const cardOf = (id: string) => chat.filter((m) => m.kind === 'card' && m.fitCheckId === id).sort((a, b) => b.createdAt - a.createdAt)[0];
  const card = (latest ? cardOf(latest.id) : undefined) ?? cardOf(check.id);
  const photoHref = photo ? `/photo/${shown.id}` : null;
  const before = latest
    ? { score: check.score, scoreText: displayScore(check.score), photo: firstPhoto, href: firstPhoto ? `/photo/${check.id}` : null }
    : null;
  const actions: LookAction[] = [
    ...(photoHref ? (['photo'] as const) : []),
    ...(before?.href ? (['before'] as const) : []),
    ...(pieces.length > 0 ? (['piece'] as const) : []),
    ...(card ? (['chat'] as const) : []),
  ];
  return {
    checkId: check.id,
    shownId: shown.id,
    title: t('viewer.caption', { occasion, date }),
    occasion,
    date,
    tag: t(latest ? (partial.label && !partial.done ? 'card.tag.recheckPartial' : 'card.tag.recheck') : partial.label && !partial.done ? 'card.tag.partial' : 'card.tag.full'),
    score,
    scoreText: displayScore(score),
    word: scoreWordLabel(score),
    scoreA11y: spokenScoreLine(score, latest ? check.score : undefined),
    before,
    partialLabel: partial.label,
    partialDone: partial.done,
    summary: readOnlySummary(shown.explanation),
    photo,
    photoHref,
    fixes,
    noFixLine,
    tip: nextLevel ? { lead: tipLeadText(shown.details.tipLead) ?? t('card.nextLevel'), text: nextLevel } : null,
    pieces,
    chatMessageId: card?.id ?? null,
    actions,
    shareId: SHARE_CARD_BUILT && canShare(shown) ? shown.id : null,
  };
}

/** Reads the look (by its first check's id, or a re-check's): null when it doesn't exist or isn't scored. Reads only. */
export async function loadLook(store: KittedStore, checkId: string, o: { zone: ZoneOffset }): Promise<LookPageModel | null> {
  let check = await store.fitChecks.get(checkId);
  if (check?.parentId) check = await store.fitChecks.get(check.parentId);
  if (!check) return null;
  const [all, closet, chat] = await Promise.all([store.fitChecks.all(), store.closet.all(), store.chat.all()]);
  return buildLook(check, all.filter((r) => r.parentId === check!.id), closet, chat, o.zone);
}
