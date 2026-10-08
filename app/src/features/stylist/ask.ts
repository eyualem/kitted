// "Ask your stylist" (02 S25) isn't built: real answers need the server and an AI call per
// question. Until then a sent question shows as his bubble and the stylist says so plainly,
// instead of the text vanishing (it used to be cleared with no reply). Doesn't count toward
// the 5 questions a day. DECISIONS-LOG #70.
import { store } from '@/data/db';
import { newId } from '@/services/ids';
import { t } from '@/i18n/en';
import { sessionClock } from '@/state/session';

export async function sendQuestion(text: string): Promise<void> {
  const now = sessionClock.nowMs();
  const base = { cardType: null, fitCheckId: null, outfitId: null, itemId: null, chips: [], payload: {} };
  await store.chat.put({ ...base, id: newId('M'), createdAt: now, role: 'user', kind: 'text', text });
  await store.chat.put({ ...base, id: newId('M'), createdAt: now + 1, role: 'stylist', kind: 'text', text: t('ask.comingSoon') });
}
