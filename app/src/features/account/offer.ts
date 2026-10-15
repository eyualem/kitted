// When "Keep your fits" is offered (10-onboarding.md §3), pure. Value first: never before a scored fit, never while a
// check is reading or waiting for a tap, never when he's signed in, and at most twice ever (the second only after 3
// more scored checks than when he said "Not now").

export interface OfferState {
  /** Offers posted so far (0, 1 or 2). */
  shown: number;
  /** He tapped "Not now" on the last one. */
  declined: boolean;
  /** Scored full checks when he said "Not now" (the second offer waits for 3 more). */
  checksAtDecline: number | null;
}

export const NO_OFFER: OfferState = { shown: 0, declined: false, checksAtDecline: null };
export const MAX_OFFERS = 2;
export const CHECKS_BEFORE_SECOND = 3;
/** Away this long, and coming back counts as a new visit (the "next visit" trigger). */
export const NEW_VISIT_AFTER_MS = 30 * 60 * 1000;

export interface OfferCheck {
  createdAt: number;
  status: string;
  /** A re-check (parentId set). */
  recheck: boolean;
}

export interface OfferInput {
  enabled: boolean;
  signedIn: boolean;
  /** A check is reading or asking the one quick tap right now. */
  busy: boolean;
  state: OfferState;
  checks: readonly OfferCheck[];
  /** When this visit started (a launch, or a return after NEW_VISIT_AFTER_MS). */
  visitStartMs: number;
}

export function parseOffer(raw: string | null): OfferState {
  if (!raw) return { ...NO_OFFER };
  try {
    const v = JSON.parse(raw) as Partial<OfferState>;
    return {
      shown: typeof v.shown === 'number' && v.shown >= 0 ? Math.floor(v.shown) : 0,
      declined: v.declined === true,
      checksAtDecline: typeof v.checksAtDecline === 'number' ? v.checksAtDecline : null,
    };
  } catch {
    return { ...NO_OFFER };
  }
}

const scored = (c: OfferCheck) => c.status === 'scored';

export function scoredFullChecks(checks: readonly OfferCheck[]): number {
  return checks.filter((c) => scored(c) && !c.recheck).length;
}

export function offerDue(i: OfferInput): boolean {
  if (!i.enabled || i.signedIn || i.busy || i.state.shown >= MAX_OFFERS) return false;
  const done = i.checks.filter(scored);
  if (done.length === 0) return false;
  if (i.state.shown === 0) {
    // After he's seen his first score: his first re-check came back, or this is a later visit than the one that scored it.
    const firstAt = Math.min(...done.map((c) => c.createdAt));
    return done.some((c) => c.recheck) || firstAt < i.visitStartMs;
  }
  // The second and last offer: only after "Not now", and 3 more scored checks.
  if (!i.state.declined || i.state.checksAtDecline === null) return false;
  return scoredFullChecks(i.checks) >= i.state.checksAtDecline + CHECKS_BEFORE_SECOND;
}

/** A new visit starts at launch, and again when he comes back after being away NEW_VISIT_AFTER_MS or more. */
export function nextVisitStart(visitStartMs: number, leftAtMs: number | null, backAtMs: number): number {
  if (leftAtMs === null) return visitStartMs;
  return backAtMs - leftAtMs >= NEW_VISIT_AFTER_MS ? backAtMs : visitStartMs;
}
