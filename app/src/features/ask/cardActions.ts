// What the card buttons do (the seam between T104's views and the logic behind them). T106 writes the add through the
// closet service (KC4.3, KC4.4, KC2.10); T107 adds the changed card's Undo (KC5.1). None of these ever uses a question
// (KC4.9): they are local writes. Each action returns whether it did anything.
import { store } from '@/data/db';
import type { KittedStore } from '@/data/store';
import type { ChatMessage } from '@/data/types';
import { addChatPiece, ownedSame, removeChatPiece, type ChatAddDeps } from '@/features/closet/chatAdd';
import { t } from '@/i18n/en';
import { newId } from '@/services/ids';
import { showToast } from '@/features/toast/toast';
import { sessionClock } from '@/state/session';
import type { AskCard, CardPiece } from './cards';

/** True once T106 has built `I have one` (the menu shows it only then). */
export const ADD_READY = true;

type AddCard = Extract<AskCard, { type: 'add' }>;

export interface CardActionDeps extends ChatAddDeps {
  store: Pick<KittedStore, 'closet' | 'chat'>;
  /** A toast with Undo, for `I have one` (the card the tile sits on has no add row to change). */
  toast?: (text: string, undo: () => void | Promise<void>) => void;
}

/** The message as stored now, and its add card; null when it isn't one (a stale tap on a deleted or changed row). */
async function addCardOf(deps: CardActionDeps, m: ChatMessage): Promise<{ row: ChatMessage; card: AddCard } | null> {
  const row = await deps.store.chat.get(m.id);
  const card = row?.payload?.askCard as AskCard | undefined;
  return row && card?.type === 'add' ? { row, card } : null;
}

async function setCard(deps: CardActionDeps, row: ChatMessage, card: AddCard): Promise<void> {
  await deps.store.chat.patch(row.id, { payload: { ...row.payload, askCard: card } });
}

export function createCardActions(deps: CardActionDeps) {
  return {
    /** The add card's Add (KC4.3): one closet piece, then `Added to Closet · Undo`. */
    add: async (m: ChatMessage): Promise<boolean> => {
      const cur = await addCardOf(deps, m);
      if (!cur || cur.card.outcome !== 'asked') return false;
      // He already has it (another card or "add it" added it): the card links to that piece, nothing is written twice.
      const have = ownedSame(await deps.store.closet.all(), cur.card.piece);
      const itemId = have ? have.id : await addChatPiece(deps, cur.card.piece);
      if (!itemId) return false;
      await setCard(deps, cur.row, { ...cur.card, outcome: 'added', itemId });
      return true;
    },
    /** The add card's No thanks (KC4.4): nothing is written; that piece isn't offered again unless he asks. */
    decline: async (m: ChatMessage): Promise<boolean> => {
      const cur = await addCardOf(deps, m);
      if (!cur || cur.card.outcome !== 'asked') return false;
      await setCard(deps, cur.row, { ...cur.card, outcome: 'declined' });
      return true;
    },
    /** Undo on an added piece (KC4.3): it leaves the closet and the card asks again. A changed card's Undo is T107's. */
    undo: async (m: ChatMessage): Promise<boolean> => {
      const cur = await addCardOf(deps, m);
      if (!cur || cur.card.outcome !== 'added') return false;
      if (cur.card.itemId) await removeChatPiece(deps, cur.card.itemId);
      await setCard(deps, cur.row, { ...cur.card, outcome: 'asked', itemId: null });
      return true;
    },
    /** A "You'd need" tile's I have one (KC2.10): adds the drawn piece as KC4.3 does, with an Undo toast. */
    haveOne: async (_m: ChatMessage, piece: CardPiece): Promise<boolean> => {
      const itemId = await addChatPiece(deps, piece);
      if (!itemId) return false;
      deps.toast?.(t('ask.card.added'), async () => { await removeChatPiece(deps, itemId); });
      return true;
    },
  };
}

/** The app's own: the real store, the session clock, and the Undo toast. */
export const cardActions = createCardActions({ store, clock: sessionClock, ids: newId, toast: (text, undo) => void showToast(text, undo) });
