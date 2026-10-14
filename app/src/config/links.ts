// Outward-facing addresses (founder fills these before App Review). While a value is null its rows are hidden
// (You › Settings, Plan & usage), so nothing links to a page that doesn't exist yet.
// App Review needs PRIVACY_URL (5.1.1(i)) and TERMS_URL (3.1.2, auto-renewing subscriptions) before submission.

/** Support inbox: "Report a wrong score" and "Contact support" (mailto). */
export const SUPPORT_EMAIL: string | null = null;
/** The hosted privacy policy. */
export const PRIVACY_URL: string | null = null;
/** The hosted terms of use (Apple's standard EULA is fine if we link it). */
export const TERMS_URL: string | null = null;
/** Apple's own subscriptions page (no StoreKit yet; P6 swaps in manageSubscriptionsSheet). */
export const MANAGE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';
