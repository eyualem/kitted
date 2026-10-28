// Closet → Pieces in head-to-toe sections (founder, Oct 28; #384). Checks P1–P6 (written before the code): the order is
// Jackets and layers · Tops · Bottoms · Shoes; empty sections are left out; inside a section the grid's own order
// (newest first) is kept; every piece shows exactly once; a thin closet (under 4 pieces, or one section) gets no titles;
// VoiceOver reads "Tops, 6 pieces". The screen keeps its ScrollView first and the "To confirm" card on top (P7–P8).
import { createMemoryStore } from '@/data/memoryStore';
import seed from '../../assets/seed.json';
import { US_EASTERN } from '@kitted/core';
import { loadScenario } from '@/data/seedLoader';
import type { ClosetItemRow } from '@/data/types';
import { closetGridItems, closetSections, pieceSectionLabel } from '@/features/closet/merge';

declare const __dirname: string;
const { readFileSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');

const row = (id: string, slot: string, addedAt: number) => ({ id, slot, addedAt, name: id, isDeleted: false }) as unknown as ClosetItemRow;

test('P1–P4: the full demo closet, head to toe, newest first inside, nothing lost or doubled', async () => {
  const store = createMemoryStore();
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: Date.parse('2026-10-22T07:41:00-04:00') });
  const grid = closetGridItems(await store.closet.all());
  const { titled, sections } = closetSections(grid);
  expect(titled).toBe(true);
  const order = ['outer', 'top', 'bottom', 'shoes'];
  expect(sections.map((s) => s.slot)).toEqual(order.filter((o) => grid.some((c) => c.slot === o)));
  expect(sections.map((s) => s.title)).toEqual(sections.map((s) => ({ outer: 'Jackets and layers', top: 'Tops', bottom: 'Bottoms', shoes: 'Shoes' })[s.slot]));
  for (const s of sections) {
    expect(s.items.length).toBeGreaterThan(0);
    expect(s.items.map((c) => c.id)).toEqual(grid.filter((c) => c.slot === s.slot).map((c) => c.id));
  }
  const ids = sections.flatMap((s) => s.items.map((c) => c.id));
  expect(ids.sort()).toEqual(grid.map((c) => c.id).sort());
});

test('P2: an empty section is left out', () => {
  const { sections } = closetSections([row('a', 'shoes', 3), row('b', 'top', 2), row('c', 'top', 1), row('d', 'shoes', 0)]);
  expect(sections.map((s) => s.slot)).toEqual(['top', 'shoes']);
  expect(sections[0]!.items.map((c) => c.id)).toEqual(['b', 'c']);
});

test('P4: a piece with no known slot joins Tops, never dropped', () => {
  const { sections } = closetSections([row('a', '', 3), row('b', 'top', 2), row('c', 'bottom', 1), row('d', 'shoes', 0)]);
  expect(sections.find((s) => s.slot === 'top')!.items.map((c) => c.id)).toEqual(['a', 'b']);
});

test('P5: a thin closet gets no titles, still head to toe', () => {
  const three = closetSections([row('s', 'shoes', 3), row('b', 'bottom', 2), row('t', 'top', 1)]);
  expect(three.titled).toBe(false);
  expect(three.sections.flatMap((s) => s.items.map((c) => c.id))).toEqual(['t', 'b', 's']);
  expect(closetSections([row('a', 'top', 4), row('b', 'top', 3), row('c', 'top', 2), row('d', 'top', 1)]).titled).toBe(false);
  expect(closetSections([row('a', 'top', 4), row('b', 'top', 3), row('c', 'top', 2), row('d', 'shoes', 1)]).titled).toBe(true);
  expect(closetSections([]).sections).toEqual([]);
});

test('P6: VoiceOver reads the title with its count', () => {
  expect(pieceSectionLabel({ title: 'Tops', items: [row('a', 'top', 1), row('b', 'top', 0)] })).toBe('Tops, 2 pieces');
  expect(pieceSectionLabel({ title: 'Shoes', items: [row('a', 'shoes', 1)] })).toBe('Shoes, 1 piece');
});

test('P7–P8: the screen keeps its ScrollView first, the To confirm card above the sections, headers as headers', () => {
  const src = readFileSync(join(__dirname, '../app/(tabs)/closet/index.tsx'), 'utf8');
  const body = src.slice(src.indexOf('return (', src.indexOf('export default function')));
  expect(body.trimStart().startsWith('return (\n    <ScrollView')).toBe(true);
  expect(body.indexOf('closet.confirm.tag')).toBeLessThan(body.indexOf('<PieceSections'));
  expect(src).toContain('accessibilityRole="header"');
});
