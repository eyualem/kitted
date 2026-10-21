// The composer capsule's three slots as plain logic (07 §18, #317), so VoiceOver's cursor survives a send or a stop.
//   lead   📷 at rest · ✕ while he talks · nothing while he types (#28)
//   middle the field · the waveform and his words while he talks
//   trail  ↑ with words · 🎙 when empty and the phone can listen · ■ while he talks
// Composer draws each slot as ONE keyed child, so the trailing button is the same view across ↑ → 🎙 → ■ → ↑ and only
// its label and icon change. Where the control he pressed goes away, the cursor is moved to the field instead.

export type LeadSlot = 'camera' | 'cancel' | null;
export type TrailSlot = 'send' | 'mic' | 'stop' | null;

export interface SlotInput {
  /** The mic is on (getting ready, listening or stopping). */
  recording: boolean;
  /** The field has focus or words. */
  typing: boolean;
  /** Words worth sending (not just spaces). */
  hasText: boolean;
  /** The phone can listen (false on the Simulator). */
  micAvailable: boolean;
}

export function composerSlots(s: SlotInput): { lead: LeadSlot; trail: TrailSlot } {
  if (s.recording) return { lead: 'cancel', trail: 'stop' };
  return {
    lead: s.typing ? null : 'camera',
    trail: s.hasText ? 'send' : s.micAvailable ? 'mic' : null,
  };
}

export interface IdleInput {
  /** It has been focused or listening since it opened. */
  used: boolean;
  /** Between the mic going quiet and the words landing. */
  stopping: boolean;
  focused: boolean;
  recording: boolean;
  empty: boolean;
  /** VoiceOver on: the composer never closes itself, so the cursor isn't left on a view that's gone (F3). */
  screenReader: boolean;
}

/** Whether the composer should hand back to the tab bar's "Ask your stylist…" bar. */
export function goesIdle(s: IdleInput): boolean {
  return s.used && !s.stopping && !s.focused && !s.recording && s.empty && !s.screenReader;
}

/** After he presses a slot's control: should VoiceOver's cursor move to the field (F4)? */
export function cursorToField(pressed: 'cancel' | 'send' | 'stop', after: TrailSlot): boolean {
  if (pressed === 'cancel') return true; // ✕ goes, and the field comes back where the waveform was
  if (pressed === 'send') return after === null; // the trailing button stays (as 🎙) unless there's no mic
  return false; // ■ turns into ↑ in place; the words are announced
}
