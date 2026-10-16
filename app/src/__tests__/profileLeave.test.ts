// The Style profile keeps his edits when he leaves without tapping Save (09-ui-review §12, Q1–Q3).
import seed from '../../assets/seed.json';
import { US_EASTERN } from '@kitted/core';
import { onChange } from '@/data/changes';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import { draftOf, saveDraft } from '@/features/you/profile';

async function setup() {
  const store = createMemoryStore();
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: Date.parse('2026-10-22T12:00:00-04:00') });
  return store;
}

test('Q1: leaving with unsaved edits saves them, as Save would', async () => {
  const store = await setup();
  const p = (await store.profile.get('me'))!;
  const draft = { ...draftOf(p), budget: '100_plus' as const };
  expect(await saveDraft(store, draft)).toBe(true);
  expect((await store.profile.get('me'))!.budget).toBe('100_plus');
});

test('Q2: leaving with nothing changed writes nothing', async () => {
  const store = await setup();
  const p = (await store.profile.get('me'))!;
  let writes = 0;
  const off = onChange(['profile'], () => { writes++; });
  expect(await saveDraft(store, draftOf(p))).toBe(false);
  off();
  expect(writes).toBe(0);
});

test('Q3: Save, then leaving, writes once', async () => {
  const store = await setup();
  const p = (await store.profile.get('me'))!;
  const draft = { ...draftOf(p), budget: 'under_30' as const };
  let writes = 0;
  const off = onChange(['profile'], () => { writes++; });
  await saveDraft(store, draft); // Save
  await saveDraft(store, draft); // then the screen leaves
  off();
  expect(writes).toBe(1);
});
