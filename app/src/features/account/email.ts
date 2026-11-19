// An address Apple hides from the app: Hide My Email's relay. You's account row shows "Hidden email" for it (SB1.4).

/** Apple's Hide My Email addresses (sent to the app instead of his real one). */
export function isRelayEmail(email: string | null): boolean {
  return !!email && /@privaterelay\.appleid\.com$/i.test(email.trim());
}
