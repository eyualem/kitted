// Switches for parts of the app that are still placeholders, so nothing points at them before they're built.

/** The paywall (P1, P1b; 10-onboarding.md §9.4) is built on a mock store. Off until the real store (RevenueCat) and the
 *  Terms and Privacy pages exist (App Review 3.1.2): no "Try Pro" points at it on his phone; demo screens turn it on. */
export const PAYWALL_BUILT = false;

/** The share card (S12, #345): built. One switch still removes the share actions and the route (the root layout
 *  registers `share/[checkId]` only while this is on, or on demo builds, #323). The card's Share button also waits for
 *  a build that has the capture and sharing modules (features/share/shareNative.ts). */
export const SHARE_CARD_BUILT = true;

/** Accounts (10-onboarding.md, specs/sign-in-and-backup.md): Continue with Apple or Google. The one switch for every
 *  sign-in entry point (Welcome's account button, the save card, You's rows): off, none shows outside demo screens
 *  130–143 (features/account/account.ts). Don't turn it on for a build until backup is in (T41b): the card says "Your
 *  fits are backed up", and deleting the account must revoke Apple's token. */
export const ACCOUNTS_BUILT = false;

/** The notification ask (02 S15) and the scheduled daily idea. Off until expo-notifications is installed (a new
 *  package, the founder's OK): without it the ask can't ask, so it isn't shown (10-onboarding.md §9.5). */
export const NOTIFICATIONS_BUILT = false;

/** Outfits, Next best buy and Goes with (specs/closet-beta.md CB1): off for the beta. Closet opens on his pieces with no
 *  Pieces | Outfits switch, a piece's page has no Outfits row or Goes with, and nothing shows an outfit count. The code
 *  stays; demo screens 182, 183, 184, 193 and 202 turn it on (features/closet/outfitsSwitch.ts). */
export const OUTFITS_BUILT: boolean = false;
