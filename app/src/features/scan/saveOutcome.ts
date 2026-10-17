// What the scan camera says after saving (09 §20.7 R4, #322): the real count, and never "Saved" when nothing was kept
// (it showed `Math.max(saved, 1)`, so a scan whose every photo failed said "Saved for your closet").
export type SaveOutcome = { kind: 'saved'; count: number } | { kind: 'notSaved'; many: boolean };

export function saveOutcome(saved: number, tried: number): SaveOutcome {
  return saved > 0 ? { kind: 'saved', count: saved } : { kind: 'notSaved', many: tried > 1 };
}
