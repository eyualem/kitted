// You tab (Oct 14, #246): the facts' guesses, delete/undo and edits; the style card's lines; Y2's save keeping
// onboarding's [style, weight] pairs.
import { US_EASTERN, type Styles } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import type { FactRow, ProfileRow } from '@/data/types';
import { picksToStyles } from '@/features/onboarding/looks';
import { getToast, hideToast } from '@/features/toast/toast';
import {
  confirmGuess, editFact, factSpoken, factTitle, FACTS_ON_YOU, forgetFact, forgetWithUndo, liveFacts, restoreFact, shortDate, sourceLine,
} from '@/features/you/facts';
import { applyDraft, basicsLine, draftOf, isDirty, picksOf, styleCardSpoken, stylesToSave } from '@/features/you/profile';

const at = (iso: string) => Date.parse(iso);
const fact = (o: Partial<FactRow> & { id: string }): FactRow => ({ key: 'k', value: 'You wear tees untucked', source: 'told', createdAt: at('2026-10-12T08:00:00-04:00'), isDeleted: false, ...o });

function profile(o: Partial<ProfileRow> = {}): ProfileRow {
  return {
    id: 'me', birthYear: 2005, heightCm: 178, build: 'average', fitPreference: 'regular', styles: [['streetwear', 0.5], ['minimalist', 0.25], ['workwear', 0.25]],
    boldness: null, budget: null, lastOccasion: 'everyday', consentVersion: '1', consentAt: 1, onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: 1,
    ...o,
  };
}

describe('facts', () => {
  it('the seed talks to you, never guesses money, and Y1 shows the mockup four', async () => {
    const s = createMemoryStore();
    await loadScenario(s, seed, { scenario: 'full', zone: US_EASTERN });
    const all = liveFacts(await s.facts.all());
    expect(all.some((f) => /\$/.test(f.value) || f.key === 'budget')).toBe(false);
    expect(all.filter((f) => f.key !== 'event').every((f) => f.value.startsWith('You '))).toBe(true);
    expect(all.slice(0, FACTS_ON_YOU).map(factTitle)).toEqual([
      'Career fair on Oct 29', 'You wear tees untucked', 'Do you like muted colors more than bright ones?', 'You like straight-leg pants',
    ]);
  });

  it('source lines and VoiceOver', () => {
    const f = fact({ id: 'F1', value: 'You like straight-leg pants', source: 'fitCheck' });
    expect(shortDate(f.createdAt, US_EASTERN)).toBe('Oct 12');
    expect(sourceLine(f, US_EASTERN)).toBe('From a fit check · Oct 12');
    expect(sourceLine({ ...f, source: 'told' }, US_EASTERN)).toBe('You told me · Oct 12');
    expect(sourceLine({ ...f, source: 'guess' }, US_EASTERN)).toBe('My guess from your fits');
    expect(factSpoken(f, US_EASTERN)).toBe('You like straight-leg pants. From a fit check, October 12.');
    expect(factSpoken({ ...f, source: 'guess', value: 'You like muted colors.' }, US_EASTERN)).toBe('Do you like muted colors? My guess from your fits.');
  });

  it('newest first, deleted ones gone', () => {
    const rows = [fact({ id: 'a', createdAt: 1 }), fact({ id: 'b', createdAt: 3 }), fact({ id: 'c', createdAt: 2, isDeleted: true })];
    expect(liveFacts(rows).map((f) => f.id)).toEqual(['b', 'a']);
  });

  it('Yes makes a guess something you told me, dated now', async () => {
    const s = createMemoryStore();
    await s.facts.put(fact({ id: 'g', source: 'guess' }));
    const now = at('2026-10-22T12:22:00-04:00');
    const r = await confirmGuess(s, 'g', now);
    expect([r?.source, r?.createdAt]).toEqual(['told', now]);
    // a second Yes changes nothing
    expect((await confirmGuess(s, 'g', now + 1))?.createdAt).toBe(now);
  });

  it('Not really / Delete is soft, and Undo restores the row exactly', async () => {
    const s = createMemoryStore();
    const before = fact({ id: 'f', source: 'fitCheck' });
    await s.facts.put(before);
    await forgetWithUndo(s, 'f');
    expect((await s.facts.get('f'))?.isDeleted).toBe(true);
    expect(liveFacts(await s.facts.all())).toEqual([]);
    const toast = getToast();
    expect(toast?.text).toBe('Forgot it.');
    await toast?.undo?.();
    expect(await s.facts.get('f')).toEqual(before);
    hideToast(toast!.id);
    // deleting a deleted fact does nothing (no second toast to undo)
    await forgetFact(s, 'f');
    expect(await forgetFact(s, 'f')).toBeNull();
    await restoreFact(s, before);
    expect((await s.facts.get('f'))?.isDeleted).toBe(false);
  });

  it('Edit / Change it saves his words as told; empty keeps the old text', async () => {
    const s = createMemoryStore();
    await s.facts.put(fact({ id: 'g', source: 'guess', value: 'You like muted colors more than bright ones' }));
    const now = at('2026-10-22T12:30:00-04:00');
    expect((await editFact(s, 'g', '   ', now))?.source).toBe('guess');
    const r = await editFact(s, 'g', '  You like  earth tones ', now);
    expect([r?.value, r?.source, r?.createdAt]).toEqual(['You like earth tones', 'told', now]);
  });
});

describe('style card and Y2', () => {
  it('picks in order, basics in one line, height left out when not given', () => {
    const p = profile();
    expect(picksOf(p.styles)).toEqual(['streetwear', 'minimalist', 'workwear']);
    expect(picksOf([['preppy', 0.5], ['old_money', 0.5]] as unknown as Styles)).toEqual(['classic_prep']);
    expect(basicsLine(p)).toBe('5′ 10″ · Average build · Regular fit');
    expect(basicsLine({ ...p, heightCm: null })).toBe('Average build · Regular fit');
    expect(basicsLine({ ...p, units: 'metric' })).toBe('178 cm · Average build · Regular fit');
    expect(styleCardSpoken(p)).toBe('Your style: Streetwear, first pick; Minimal; Workwear. 5 feet 10 inches, average build, regular fit. Edit.');
  });

  it('saving with the same picks keeps the stored pairs; new picks use onboarding weights', () => {
    const odd: Styles = [['smart_casual', 0.6], ['workwear', 0.4]];
    expect(stylesToSave(odd, ['smart_casual', 'workwear'])).toBe(odd);
    expect(stylesToSave(odd, ['workwear', 'smart_casual'])).toEqual(picksToStyles(['workwear', 'smart_casual']));
    expect(stylesToSave(odd, [])).toEqual([]);
  });

  it('applyDraft changes only what he changed; birth year and boldness never move', () => {
    const p = profile({ heightCm: 180, boldness: 'bold', budget: null });
    const d = draftOf(p);
    expect(isDirty(p, d)).toBe(false);
    expect(applyDraft(p, d)).toEqual(p);
    const next = applyDraft(p, { ...d, fit: 'relaxed', budget: 'prefer_not' });
    expect(next).toEqual({ ...p, fitPreference: 'relaxed', budget: 'prefer_not' });
    expect(isDirty(p, { ...d, heightIn: (d.heightIn ?? 0) + 1 })).toBe(true);
    expect(applyDraft(p, { ...d, heightIn: 72 }).heightCm).toBe(183);
  });
});
