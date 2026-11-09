// T73 stub (specs/closet-beta.md CB1): the Outfits switch. The tests come before the code; each throws until built.
import type { ScreenScenario } from '@/demo/scenarios';

export function outfitsOn(): boolean {
  throw new Error('T73: not built');
}

export function setDemoOutfits(on: boolean): void {
  void on;
  throw new Error('T73: not built');
}

export function useOutfitsOn(): boolean {
  throw new Error('T73: not built');
}

export function prepareOutfitsDemo(sc: Pick<ScreenScenario, 'outfits'>): void {
  void sc;
  throw new Error('T73: not built');
}
