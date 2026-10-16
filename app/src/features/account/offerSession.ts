// The app's one offer service, and the hook Stylist runs it from (10-onboarding.md §3).
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { AppState } from 'react-native';
import { store } from '@/data/db';
import { onChange } from '@/data/changes';
import { fitCheck } from '@/features/fitcheck/session';
import { newId } from '@/services/ids';
import { sessionClock } from '@/state/session';
import { finish } from '@/features/finish/session';
import { createOfferService } from './offerService';

/** After a check changes, wait this long: the card never lands on top of a score reveal. */
export const OFFER_SETTLE_MS = 4_000;

export const accountOffer = createOfferService({
  store,
  now: () => sessionClock.nowMs(),
  ids: newId,
  busy: () => fitCheck.getState().kind !== 'idle',
  holds: () => finish.holdsOffer(),
});

export function useAccountOffer(): void {
  useFocusEffect(
    useCallback(() => {
      void accountOffer.ensure();
      let timer: ReturnType<typeof setTimeout> | null = null;
      const later = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => void accountOffer.ensure(), OFFER_SETTLE_MS);
      };
      const off = onChange(['fitChecks'], later);
      const sub = AppState.addEventListener('change', (st) => {
        if (st === 'background') accountOffer.left();
        if (st === 'active') {
          accountOffer.back();
          void accountOffer.ensure();
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
