// Switches for parts of the app that are still placeholders, so nothing points at them before they're built.
import { APPLE_PAID } from './apple';

/** The paywall (P1, P1b; 10-onboarding.md §9.4) is built on a mock store. Off until the real store (RevenueCat) and the
 *  Terms and Privacy pages exist (App Review 3.1.2): no "Try Pro" points at it on his phone; demo screens turn it on. */
export const PAYWALL_BUILT = false;

/** The share card (S12, #345): built. One switch still removes the share actions and the route (the root layout
 *  registers `share/[checkId]` only while this is on, or on demo builds, #323). The card's Share button also waits for
 *  a build that has the capture and sharing modules (features/share/shareNative.ts). */
export const SHARE_CARD_BUILT = true;

/** Accounts (10-onboarding.md): Continue with Apple, Google or email. Off until Firebase is set up (08 §6 A0–A1), so no
 *  sign-in shows on his phone that does nothing; demo screens 130–143 turn them on (features/account/account.ts). */
export const ACCOUNTS_BUILT = false;

/** The notification ask (02 S15) and the scheduled daily idea. Off until expo-notifications is installed (a new
 *  package, the founder's OK): without it the ask can't ask, so it isn't shown (10-onboarding.md §9.5). */
export const NOTIFICATIONS_BUILT = false;

/** Sign-in methods wired to the real Firebase project (#295, 10-onboarding.md §12), from three facts (SI1):
 *  - Release: Apple and Google together, only once accounts are on and the team is paid (the build then carries Sign in
 *    with Apple's entitlement). Never Google alone (Apple 4.8). So `ACCOUNTS_BUILT = true` is the one switch.
 *  - Dev builds (his phone through Metro): Google, plus Apple once the team is paid, in You → Settings → Account only,
 *    while the rest of accounts stays off. Signing in backs nothing up until AU1, which is why the save offer and
 *    Welcome's "I already have an account" stay hidden.
 *  Email waits for a server route that sends the code (AC1, AU7). */
export function signInLive(o: { accountsBuilt: boolean; applePaid: boolean; dev: boolean }): readonly ('apple' | 'google' | 'email')[] {
  if (!o.dev) return o.accountsBuilt && o.applePaid ? ['apple', 'google'] : [];
  return o.applePaid ? ['apple', 'google'] : ['google'];
}

export const SIGN_IN_LIVE = signInLive({ accountsBuilt: ACCOUNTS_BUILT, applePaid: APPLE_PAID, dev: __DEV__ });
