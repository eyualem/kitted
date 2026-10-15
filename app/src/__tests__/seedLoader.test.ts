import { score, US_EASTERN, type Reading, type Styles } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { fixFromSeed, loadScenario, scenarioNow } from '@/data/seedLoader';

const at = (iso: string) => Date.parse(iso);

describe('seed loader: full', () => {
  it('loads the 12:20 state with the 04 §10.2 counts', async () => {
    const s = createMemoryStore();
    const sum = await loadScenario(s, seed, { scenario: 'full', zone: US_EASTERN });
    expect(sum.nowMs).toBe(at('2026-10-22T12:20:00-04:00'));
    const closet = await s.closet.all();
    expect(closet).toHaveLength(16);
    const bySlot = (slot: string) => closet.filter((c) => c.slot === slot).length;
    expect([bySlot('top'), bySlot('bottom'), bySlot('shoes'), bySlot('outer')]).toEqual([6, 3, 4, 3]);
    expect(closet.find((c) => c.id === 'L3')!.isPhotographed).toBe(false);
    expect(closet.find((c) => c.id === 'B1')!.confirmedFields).toEqual(['leg_shape']);
    expect(closet.find((c) => c.id === 'T1')!.hex).toBe('#F2F0EA');
    // V6 (#91): one 'seed' sighting per item with its closet fields (never scored); the tiles keep the seed colors.
    const obs = await s.closetObs.all();
    expect(obs).toHaveLength(16);
    expect(obs.every((o) => o.origin === 'seed' && o.decision === 'new' && o.itemId === o.id.slice(2))).toBe(true);
    expect(obs.find((o) => o.itemId === 'L3')!.closet).toBeNull();
    expect(obs.find((o) => o.itemId === 'S3')!.closet).toMatchObject({ logo_text: 'New Balance', shoe_profile: 'regular' });
    expect(closet.find((c) => c.id === 'T2')!.art).toEqual({ family: 'grey', shade: 'grey|-|heather', details: [], brand: null, pattern: 'solid', shoeProfile: null, denimWear: null });
    expect(closet.find((c) => c.id === 'B1')!.hex).toBe('#C9B48A');
    expect(closet.every((c) => !('closet' in c.garment))).toBe(true);

    const checks = (await s.fitChecks.all()).sort((a, b) => a.createdAt - b.createdAt);
    expect(checks.map((c) => [c.id, c.score])).toEqual([['FC0', 8], ['FC1', 9], ['FC2', 6.5], ['FC3', 8], ['FC3R', 9]]);
    expect(checks.filter((c) => c.isFirstCheck).map((c) => c.id)).toEqual(['FC0']);
    const fc3r = checks.find((c) => c.id === 'FC3R')!;
    expect(fc3r.parentId).toBe('FC3');
    expect(fc3r.details.recheck).toMatchObject({ parentScore: 8, delta: 1, doneFixes: [{ copy: 'Wear the overshirt, open', earned: 0.75 }] });
    const fc2 = checks.find((c) => c.id === 'FC2')!;
    expect([fc2.isPartial, fc2.snapState, fc2.details.finish?.suggestedItemId]).toEqual([true, 'skipped', 'S1']);

    expect(await s.usage.get('2026-10-22')).toEqual({ dayKey: '2026-10-22', checks: 1, rechecks: 1, questions: 2, items: 0 });
    expect((await s.facts.all()).length).toBe(8); // the money fact (F2) left the seed: budget is only ever asked (#246)
    expect((await s.wearLog.all()).length).toBe(19);
    const chat = await s.chat.all();
    expect(chat.find((m) => m.id === 'M00')!.payload).toEqual({ aiNote: true });
    expect(chat.filter((m) => m.payload.counts === true).length).toBe(2);
    // The counter flag isn't `question` any more: that key is the which-one card's (payload.question = 'whichOne').
    expect(chat.filter((m) => m.payload.question !== undefined).length).toBe(0);
    expect(chat.length).toBe(19); // M00 + M01–M18
    expect((await s.outfits.get('O_INTERVIEW'))!.title).toBe('Sharp, not stiff');
  });

  it('as of 08:01, the thread ends at M09 and no questions are used', async () => {
    const s = createMemoryStore();
    await loadScenario(s, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: at('2026-10-22T08:01:00-04:00') });
    const ids = (await s.chat.all()).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id)).map((m) => m.id);
    expect(ids[ids.length - 1]).toBe('M09');
    expect((await s.usage.get('2026-10-22'))!.questions).toBe(0);
  });

  it('every seeded check re-scores to its stored score from its own reading', async () => {
    const s = createMemoryStore();
    await loadScenario(s, seed, { scenario: 'full', zone: US_EASTERN });
    const styles = seed.scenarios.full.profile.styles as unknown as Styles;
    for (const c of await s.fitChecks.all()) {
      const r = (await s.readings.get(c.readingId!))!;
      const got = score(r.reading as Reading, { occasion: c.occasion, styles });
      expect([c.id, got.overall]).toEqual([c.id, c.score]);
    }
  });

  it('maps snake_case fixes to the core shape', () => {
    const f = fixFromSeed(seed.scenarios.full.fitChecks[3]!.fixes[0]);
    expect(f).toMatchObject({ target: 'K1_layered', toRaw: 8.75, rawGain: 0.75, itemId: null, copy: 'Wear the overshirt, open' });
    expect(Object.keys(f)).not.toContain('to_raw');
  });
});

describe('seed loader: firstRun', () => {
  it('is empty at 07:38', async () => {
    const s = createMemoryStore();
    const sum = await loadScenario(s, seed, { scenario: 'firstRun', zone: US_EASTERN });
    expect(sum.nowMs).toBe(scenarioNow(seed, 'firstRun'));
    expect(sum.nowMs).toBe(at('2026-10-22T07:38:00-04:00'));
    expect(await s.closet.all()).toEqual([]);
    expect(await s.chat.all()).toEqual([]);
    expect(await s.profile.get('me')).toBeNull();
  });
});
