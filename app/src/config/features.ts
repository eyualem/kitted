// Switches for parts of the app that are still placeholders, so nothing points at them before they're built.

/** The paywall (P1) is still a placeholder: no "Try Pro" button points at it until P6 builds it. */
export const PAYWALL_BUILT = false;

/** Accounts (10-onboarding.md): Continue with Apple, Google or email. Off until Firebase is set up (08 §6 A0–A1), so no
 *  sign-in shows on his phone that does nothing; demo screens 130–143 turn them on (features/account/account.ts). */
export const ACCOUNTS_BUILT = false;
