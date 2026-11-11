// What a notification tap opens (specs/notifications.md NT2, NT6): a nudge opens Stylist at today's card (the card of
// the window he taps in, posted then if it isn't yet); Fit check ready opens Stylist at that check's card. Never the
// camera.
import type { KittedStore } from '@/data/store';
import type { StylistAction } from '@/router/stylistAction';
import type { Clock } from '@/services/clock';
import type { NotificationData } from '@/services/notifications';
import { ideaId, slotAt } from './service';

export interface TapDeps {
  store: KittedStore;
  clock: Clock;
  /** morning.ensureCard(). */
  ensureTodaysCard: () => Promise<unknown>;
  /** router.navigate('/stylist'). */
  navigate: () => void;
  /** setStylistAction (router/stylistAction.ts). */
  setAction: (a: StylistAction) => void;
}

export async function openFromNotification(data: NotificationData, d: TapDeps): Promise<void> {
  if (data.kind === 'ready') {
    const card = (await d.store.chat.all()).find((m) => m.cardType === 'fitCheck' && m.fitCheckId === data.checkId);
    d.navigate();
    if (card) d.setAction({ kind: 'scrollTo', messageId: card.id });
    return;
  }
  d.navigate();
  await d.ensureTodaysCard();
  const { day, slot } = slotAt(d.clock.nowMs(), d.clock.offset);
  const row = await d.store.dailyIdeas.get(ideaId(day, slot));
  // No card (fit checks turned off, S26): Stylist at its end.
  if (row?.messageId) d.setAction({ kind: 'scrollTo', messageId: row.messageId });
}
