import { G } from '@kitted/core';
import { IDLE, pendingSlots, piecesCount, reduce, stageStates, type SessionState } from '@/features/fitcheck/machine';

const start = reduce(IDLE, { t: 'start', checkId: 'FC-1', mode: 'check', occasion: 'everyday', attempt: 1 }) as Extract<SessionState, { kind: 'reading' }>;
const tee = G('top', 'tee', 'white');
const stageOf = (s: SessionState) => (s.kind === 'reading' ? s.stage : 'pieces');

describe('reading session reducer', () => {
  it('starts on "Finding your pieces" with nothing found', () => {
    expect(start).toMatchObject({ kind: 'reading', stage: 'pieces', slots: [], slow: false, hedged: false, occasionTouched: false });
    expect(stageStates(start.stage)).toEqual(['now', 'pending', 'pending', 'pending']);
  });
  it('counts found pieces against the expected total; fit and color advance the stages', () => {
    let s = reduce(start, { t: 'read', attempt: 1, e: { type: 'stage', stage: 'sending', expectedSlots: 3 } });
    s = reduce(s, { t: 'read', attempt: 1, e: { type: 'slotFound', slot: 'top', garment: tee } });
    s = reduce(s, { t: 'read', attempt: 1, e: { type: 'slotMissing', slot: 'footwear' } });
    expect(piecesCount(s as never)).toEqual({ found: 1, total: 3 });
    expect(pendingSlots(s as never)).toEqual(['bottom']);
    s = reduce(s, { t: 'read', attempt: 1, e: { type: 'stage', stage: 'fit' } });
    expect(stageStates(stageOf(s))).toEqual(['done', 'now', 'pending', 'pending']);
    s = reduce(s, { t: 'read', attempt: 1, e: { type: 'stage', stage: 'color' } });
    s = reduce(s, { t: 'scored', attempt: 1 });
    expect(stageStates(stageOf(s))).toEqual(['done', 'done', 'done', 'now']);
  });
  it('slow once; hedge only before the first piece; stale timers ignored', () => {
    expect(reduce(start, { t: 'tick', attempt: 1, which: 'slow' })).toMatchObject({ slow: true });
    expect(reduce(start, { t: 'tick', attempt: 2, which: 'slow' })).toBe(start);
    expect(reduce(start, { t: 'tick', attempt: 1, which: 'hedge' })).toMatchObject({ hedged: true });
    const found = reduce(start, { t: 'read', attempt: 1, e: { type: 'slotFound', slot: 'top', garment: tee } });
    expect(reduce(found, { t: 'tick', attempt: 1, which: 'hedge' })).toBe(found);
  });
  it('occasion taps are stored (hint hides); a re-check ignores them', () => {
    expect(reduce(start, { t: 'occasion', occasion: 'date' })).toMatchObject({ occasion: 'date', occasionTouched: true });
    const rc = reduce(IDLE, { t: 'start', checkId: 'FC-2', mode: 'recheck', occasion: 'date', attempt: 3 });
    expect(reduce(rc, { t: 'occasion', occasion: 'gym' })).toBe(rc);
  });
  it('end goes back to idle; events while idle do nothing', () => {
    expect(reduce(start, { t: 'end' })).toBe(IDLE);
    expect(reduce(IDLE, { t: 'tick', attempt: 1, which: 'slow' })).toBe(IDLE);
  });
  it("an earlier attempt's end leaves a newer reading card alone; its own end closes it", () => {
    const second = reduce(start, { t: 'start', checkId: 'FC-2', mode: 'check', occasion: 'everyday', attempt: 2 });
    expect(reduce(second, { t: 'end', attempt: 1 })).toBe(second);
    expect(reduce(second, { t: 'end', attempt: 2 })).toBe(IDLE);
    expect(reduce(second, { t: 'end' })).toBe(IDLE);
  });
});
