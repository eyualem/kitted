// The add card's logic (T106; specs/kit-stylist-chat.md KC4.1–KC4.9). Runs on the phone before Kit answers:
//   · He mentions a piece ("I have a white tee"): no card if he already owns that kind and color (KC4.1), or it was
//     offered today (KC4.8) or he said no thanks before (KC4.4); else the add card asks. Nothing is written (KC4.2).
//   · He asks to add it ("add it", "can you add that to my closet"): the code adds it now, so Kit's words can say so
//     (KC4.5); the gate lets "added" through only because `didAdd` is set.
//   · The kind or color can't be read: a tap question (KC4.7). A color is never guessed: a piece drawn the wrong color
//     is the Nov 12 bug, so "add it" with no color asks which. A mention with no color or kind just shows no card.
// Kit's evidence lines here are rules text for the model, not copy users read. The model never writes these cards.
import { dayKey, type ZoneOffset } from '@kitted/core';
import type { KittedStore } from '@/data/store';
import type { ChatMessage, ClosetItemRow } from '@/data/types';
import { addChatPiece, ownedSame, removeChatPiece, type ChatAddDeps } from '@/features/closet/chatAdd';
import { t } from '@/i18n/en';
import { cardPiece, colorName, kindNoun, slotOfKind, type AskCard, type CardPiece, type PieceSlot } from './cards';
import { colorOf, pieceWordsOf } from './memory';
import type { AddRead } from './router';

/** What a tap question waits for, kept on Kit's row so his tap can finish the add. */
export interface AddPending {
  mode: 'mention' | 'ask';
  kind: string | null;
  color: string | null;
}

export interface AddPlan {
  /** The card Kit's answer shows (instead of the model's block), or null for none. */
  card: AskCard | null;
  /** One rules line for the model; empty for none. */
  evidence: string;
  /** The code wrote a piece before the answer: the gate may let "added" through. */
  didAdd: boolean;
  /** Takes the piece back again: the answer failed, so it never showed `Added to Closet`. */
  rollback?: () => Promise<void>;
  /** Stored on Kit's row when the card is a tap question. */
  payload?: { addPending: AddPending };
  /** The model's own card may show instead of this one (a mention that comes with a real question). */
  yieldsToModel: boolean;
}

export const NO_PLAN: AddPlan = { card: null, evidence: '', didAdd: false, yieldsToModel: false };

export interface PlanInput {
  question: string;
  read: AddRead | null;
  /** The tapped card's row id, when his question is a tap answer. */
  tapOf?: string | null;
  at: number;
  zone: ZoneOffset;
  store: Pick<KittedStore, 'closet' | 'chat'>;
  deps: ChatAddDeps;
}

const KINDS_BY_SLOT: Readonly<Record<string, readonly string[]>> = {
  top: ['tee', 'sweater', 'hoodie', 'overshirt'],
  shoes: ['low_profile_sneaker', 'work_boot', 'loafer'],
  bottom: ['jeans', 'chinos', 'trousers'],
  outer: ['bomber', 'denim_jacket', 'field_jacket'],
};
const GENERIC_KINDS = ['tee', 'jeans', 'low_profile_sneaker', 'field_jacket'];
const COLOR_CHOICES = ['black', 'white', 'grey', 'navy'];

const slotHint = (text: string): PieceSlot | null => {
  const q = ` ${text.toLowerCase()} `;
  if (/\b(?:on top|top|shirt)\b/.test(q)) return 'top';
  if (/\b(?:shoes|footwear|on my feet)\b/.test(q)) return 'shoes';
  if (/\b(?:pants|bottoms|on the bottom)\b/.test(q)) return 'bottom';
  if (/\b(?:outerwear|layer)\b/.test(q)) return 'outer';
  return null;
};

const tapQuestion = (question: string, options: string[], pending: AddPending, ofKinds: boolean): AddPlan => ({
  ...NO_PLAN,
  card: { type: 'ask', question, options: [...options, t('gf.notSure')] },
  evidence: `He asked you to add a piece, but ${ofKinds ? 'the kind of piece' : 'its color'} isn't clear. The app is asking him with a tap card (${ofKinds ? 'what kind' : 'what color'}). Say nothing about the card, and never say you can't add pieces.`,
  payload: { addPending: pending },
});

const addCards = (chat: readonly ChatMessage[]) =>
  chat.flatMap((m) => {
    const c = m.payload?.askCard as { type?: string; piece?: CardPiece; outcome?: string } | undefined;
    return m.role === 'stylist' && c?.type === 'add' && c.piece ? [{ m, piece: c.piece, outcome: c.outcome as string }] : [];
  });

const sameP = (a: Pick<CardPiece, 'kind' | 'color'>, b: Pick<CardPiece, 'kind' | 'color'>) => a.kind === b.kind && a.color === b.color;

/** What to do with his message about adding (KC4). */
export async function planAdd(i: PlanInput): Promise<AddPlan> {
  let read = i.read;
  let pending: AddPending | null = null;
  // A tap answer to the kind or color question: it finishes the same add.
  if (i.tapOf) {
    const row = await i.store.chat.get(i.tapOf);
    pending = (row?.payload?.addPending as AddPending | undefined) ?? null;
    if (!pending) return NO_PLAN;
    const w = pieceWordsOf(i.question);
    const kind = pending.kind ?? w.kind;
    if (!kind) return NO_PLAN; // "Not sure" to the kind question: no add, Kit just answers.
    // "Not sure" to the color question: no add either. A kind with no color yet goes on to the color question.
    if (pending.kind !== null && !colorOf(i.question)) return NO_PLAN;
    read = { mode: pending.mode, kind, color: pending.color ?? colorOf(i.question) };
  }
  if (!read) return NO_PLAN;
  const chat = await i.store.chat.all();
  const closet = await i.store.closet.all();
  const today = dayKey(i.at, i.zone);
  const cards = addCards(chat);

  // "Add it" with no kind in the words: the piece he was last offered today (asked or declined).
  if (read.mode === 'ask' && !read.kind) {
    const last = [...cards].reverse().find((c) => dayKey(c.m.createdAt, i.zone) === today && (c.outcome === 'asked' || c.outcome === 'declined'));
    if (last) read = { mode: 'ask', kind: last.piece.kind, color: last.piece.color };
  }
  if (!read.kind) {
    if (read.mode !== 'ask') return NO_PLAN;
    const hint = slotHint(i.question);
    const kinds = hint ? KINDS_BY_SLOT[hint] ?? GENERIC_KINDS : GENERIC_KINDS;
    return tapQuestion(t('ask.card.addKind'), kinds.map((k) => kindNoun(k).replace(/^./, (c) => c.toUpperCase())), { mode: 'ask', kind: null, color: read.color }, true);
  }
  if (!slotOfKind(read.kind) || slotOfKind(read.kind) === 'accessory') return NO_PLAN;
  if (!read.color) {
    if (read.mode !== 'ask') return NO_PLAN;
    return tapQuestion(t('ask.card.addColor'), COLOR_CHOICES.map((c) => colorName(c)!), { mode: 'ask', kind: read.kind, color: null }, false);
  }
  const piece = cardPiece(read.kind, read.color);
  if (!piece) return NO_PLAN;

  // KC4.1: he already has it, so Kit uses that piece by its closet name and nothing is offered.
  const have = ownedSame(closet as ClosetItemRow[], piece);
  if (have) {
    return { ...NO_PLAN, evidence: `He already has ${have.name} in his closet. Use that piece by that name. Never offer to add it and never say you can't add pieces.` };
  }

  if (read.mode === 'mention') {
    // KC4.4 (said no thanks, ever) and KC4.8 (offered today): not again, unless he asks to add it.
    const seen = cards.some((c) => sameP(c.piece, piece) && (c.outcome === 'declined' || dayKey(c.m.createdAt, i.zone) === today));
    if (seen) return NO_PLAN;
    return {
      ...NO_PLAN,
      card: { type: 'add', piece, outcome: 'asked', itemId: null },
      evidence: `He told you he has ${piece.name}. The app is showing him a card that asks whether to add it to his closet. Say nothing about adding it (the card asks), and never say you can't add pieces.`,
      yieldsToModel: true,
    };
  }

  // KC4.5: he asked, so the code adds it now.
  const itemId = await addChatPiece(i.deps, piece);
  if (!itemId) return NO_PLAN;
  // An older card still asking about this piece now shows it as added too, so its Add can't write a second one.
  for (const c of cards) {
    if (c.outcome === 'asked' && sameP(c.piece, piece)) {
      await i.store.chat.patch(c.m.id, { payload: { ...c.m.payload, askCard: { ...(c.m.payload.askCard as object), outcome: 'added', itemId } } });
    }
  }
  return {
    card: { type: 'add', piece, outcome: 'added', itemId },
    evidence: `The app just added ${piece.name} to his closet; under your answer he sees "Added to Closet" with Undo. Say in one short sentence that it's added, and don't ask whether to add it. Use the name ${piece.name} for it. Never say you can't add pieces.`,
    didAdd: true,
    rollback: async () => { await removeChatPiece(i.deps, itemId); },
    yieldsToModel: false,
  };
}
