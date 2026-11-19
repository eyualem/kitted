// What the card buttons do (the seam between T104's views and the logic behind them). T104 draws Add, No thanks, Undo
// and I have one; T106 writes the add through the closet service (KC4.3, KC4.4, KC2.10) and T107 the correction's Undo
// (KC5.1). Until then the add and changed cards can't appear outside demo screens (only code builds them, never the
// model's block), and `I have one` stays out of the "You'd need" menu, since an outfit card from the model can reach a
// tester before T106 lands. Each action returns whether it did anything.
import type { ChatMessage } from '@/data/types';
import type { CardPiece } from './cards';

/** True once T106 has built `I have one` (the menu shows it only then). */
export const ADD_READY = false;

export const cardActions = {
  /** The add card's Add (KC4.3). */
  add: async (_m: ChatMessage): Promise<boolean> => false,
  /** The add card's No thanks (KC4.4). */
  decline: async (_m: ChatMessage): Promise<boolean> => false,
  /** Undo on an added piece (KC4.3) or a changed one (KC5.1). */
  undo: async (_m: ChatMessage): Promise<boolean> => false,
  /** A "You'd need" tile's I have one (KC2.10): adds the drawn piece as KC4.3 does. */
  haveOne: async (_m: ChatMessage, _piece: CardPiece): Promise<boolean> => false,
};
