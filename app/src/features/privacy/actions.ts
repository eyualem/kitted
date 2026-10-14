// The privacy screen's actions, wired to the app: the check in flight is stopped and the closet's writes settle
// first (so nothing writes a photo path back after the wipe), then wipe.ts runs on the real store and files.
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { store } from '@/data/db';
import { clearDeviceId } from '@/data/secure';
import { DEMO_ENABLED } from '@/demo/config';
import { setAppAppearance } from '@/design-system';
import { fitCheck } from '@/features/fitcheck/session';
import { setOnboarded } from '@/state/appGate';
import { realPrivacyFiles } from './files';
import { deleteAllData, deleteAllPhotos, forgetFacts, withdrawConsent } from './wipe';

async function quiet(): Promise<void> {
  await fitCheck.cancel().catch(() => {});
  await fitCheck.closet.settle().catch(() => {});
}

/** "Score my fits" off: consent is withdrawn and a read in flight is stopped, so nothing more leaves the phone. */
export async function turnScoringOff(): Promise<void> {
  await withdrawConsent(store);
  await fitCheck.cancel().catch(() => {});
}

/** "Score my fits" on: he re-agrees on the consent sheet (never granted silently). */
export function turnScoringOn(): void {
  router.push('/sheets/consent?from=privacy');
}

export async function runDeleteAllPhotos() {
  await quiet();
  return deleteAllPhotos({ store, files: realPrivacyFiles });
}

export async function runForgetFacts() {
  return forgetFacts(store);
}

/** Everything but the age block, then back to Welcome (O1): the gate swaps the tabs for onboarding. */
export async function runDeleteAllData(): Promise<void> {
  await quiet();
  await deleteAllData({ store, files: realPrivacyFiles, clearDeviceId, demo: DEMO_ENABLED });
  // The saved appearance was in kv (applied at launch); the running app drops it now too.
  if (Platform.OS !== 'web') setAppAppearance('system');
  await setOnboarded(false);
  // As onboarding's end does in reverse (ConsentScreen): "/" sends him through the gate, now to Welcome.
  router.replace('/');
}
