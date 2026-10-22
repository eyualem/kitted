// The app's one "About you" service (10-onboarding.md §10, #369), and the hook Stylist runs it from. Held while the
// end-of-onboarding sequence is due or under way or posted this visit (finish.holdsOffer), and in a visit where the
// save offer posted: one ask per visit.
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { AppState } from 'react-native';
import { store } from '@/data/db';
import { onChange } from '@/data/changes';
import { finish, sequenceOn } from '@/features/finish/session';
import { fitCheck } from '@/features/fitcheck/session';
import { newId } from '@/services/ids';
import { sessionClock } from '@/state/session';
import { accountPostedSince, createAboutYouService } from './service';

/** After a check changes, wait this long: the card never lands on top of a score reveal (the save offer's 4 s). */
export const ABOUT_YOU_SETTLE_MS = 4_000;

export const aboutYou = createAboutYouService({
  store,
  now: () => sessionClock.nowMs(),
  ids: newId,
  busy: () => fitCheck.getState().kind !== 'idle',
  held: async (visitStartMs) => (await finish.holdsOffer()) || (await accountPostedSince(store, visitStartMs)),
  // Demo screens that aren't about it leave their stories alone, like the sequence.
  enabled: () => sequenceOn(),
});

export function useAboutYou(): void {
  useFocusEffect(
    useCallback(() => {
      void aboutYou.ensure();
      let timer: ReturnType<typeof setTimeout> | null = null;
      const off = onChange(['fitChecks'], () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => void aboutYou.ensure(), ABOUT_YOU_SETTLE_MS);
      });
      const sub = AppState.addEventListener('change', (st) => {
        if (st === 'background') aboutYou.left();
        if (st === 'active') {
          aboutYou.back();
          void aboutYou.ensure();
        }
      });
      return () => {
        off();
        sub.remove();
        if (timer) clearTimeout(timer);
      };
    }, []),
  );
}
