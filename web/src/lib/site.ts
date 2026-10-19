// The site's settings (handoff/15-landing-page.md). `npm run guard` refuses a deploy while anything marked "needed
// before deploy" is still null.
export const SITE = {
  origin: 'https://trykitted.com',
  /** Needed before deploy (CLAUDE.md to-do P1): the support page and the privacy page's contact. */
  supportEmail: null as string | null,
  /** When the first invites go out; the done line says "starting in November" until then. */
  firstInvites: 'November',
  /** Apple's standard EULA, which the terms page links for the app itself. */
  appleEula: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
  /** The day the privacy page last changed. */
  policyDate: 'October 19, 2026',
} as const;
