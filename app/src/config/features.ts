// Switches for parts of the app that are still placeholders, so nothing points at them before they're built.

/** The paywall (P1, P1b; 10-onboarding.md §9.4) is built on a mock store. Off until the real store (RevenueCat) and the
 *  Terms and Privacy pages exist (App Review 3.1.2): no "Try Pro" points at it on his phone; demo screens turn it on. */
export const PAYWALL_BUILT = false;

/** Accounts (10-onboarding.md): Continue with Apple, Google or email. Off until Firebase is set up (08 §6 A0–A1), so no
 *  sign-in shows on his phone that does nothing; demo screens 130–143 turn them on (features/account/account.ts). */
export const ACCOUNTS_BUILT = false;

/** The notification ask (02 S15) and the scheduled daily idea. Off until expo-notifications is installed (a new
 *  package, the founder's OK): without it the ask can't ask, so it isn't shown (10-onboarding.md §9.5). */
export const NOTIFICATIONS_BUILT = false;
