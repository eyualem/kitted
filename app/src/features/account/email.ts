// "Continue with email" (10-onboarding.md §4.2), pure: what counts as an address, the 6-digit code, the resend wait,
// and how an address is shown (Apple's Hide My Email relay reads "Hidden email").

/** Seconds before "Resend code" works again. */
export const RESEND_WAIT_S = 30;
export const CODE_LENGTH = 6;

/** What he typed, trimmed (spaces from autofill or a paste). Case is kept for showing it back. */
export function cleanEmail(raw: string): string {
  return raw.trim().replace(/\s+/g, '');
}

/** Compared and sent lower-case. */
export function emailKey(raw: string): string {
  return cleanEmail(raw).toLowerCase();
}

/** One @, something before it, a dot in the domain with something after it, no spaces. Deliberately loose: the code
 *  email is the real check. */
export function isValidEmail(raw: string): boolean {
  const e = cleanEmail(raw);
  if (e.length > 254) return false;
  return /^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/.test(e);
}

/** Only digits, at most 6 (a pasted "123 456" or "Code: 123456" still lands). */
export function cleanCode(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, CODE_LENGTH);
}

export const isCompleteCode = (code: string) => code.length === CODE_LENGTH;

/** Apple's Hide My Email addresses (sent to the app instead of his real one). */
export function isRelayEmail(email: string | null): boolean {
  return !!email && /@privaterelay\.appleid\.com$/i.test(email.trim());
}

/** Seconds left before a resend, from when the last code was sent. */
export function resendLeft(sentAtMs: number | null, nowMs: number): number {
  if (sentAtMs === null) return 0;
  return Math.max(0, Math.ceil((sentAtMs + RESEND_WAIT_S * 1000 - nowMs) / 1000));
}

/** "0:30", "0:05". */
export function countdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
