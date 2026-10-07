// Rotation on the seed closet: fixtures/rotation_expected.json (kitted_logic.rotation).
import { describe, expect, it } from "vitest";
import { rotation, type ClosetItem, type Styles } from "../src/index";
import { loadJSON, seedCloset } from "./helpers";

const RX = loadJSON("rotation_expected.json");
const SEED = loadJSON("seed.json");
const CLOSET = seedCloset();
const STYLES = RX.styles as Styles;

describe("rotation", () => {
  const all = rotation(CLOSET, STYLES);
  const core = rotation(CLOSET, STYLES, { layers: false });

  it("180 with layers, 48 core only", () => {
    expect(all.count).toBe(RX.rotation_with_layers);
    expect(core.count).toBe(RX.rotation_core_only);
  });

  it("before this week (items created before Sun Oct 18)", () => {
    const before = rotation(CLOSET.filter((c) => (c.createdAt ?? "").slice(0, 10) < "2026-10-18"), STYLES).count;
    expect(before).toBe(RX.rotation_before_this_week);
    expect(all.count - before).toBe(RX.week_delta);
  });

  it("+N fits per item", () => {
    const got: Record<string, number> = {};
    for (const c of CLOSET) got[c.id] = all.count - rotation(CLOSET.filter((x) => x !== c), STYLES).count;
    expect(got).toEqual(RX.fits_added_per_item);
  });

  it("next-best-buy deltas", () => {
    const got: Record<string, { layers: number; coreOnly: number }> = {};
    for (const b of SEED.scenarios.full.nextBestBuy as any[]) {
      if (b.slot === "extra") {
        got[b.id] = { layers: 0, coreOnly: 0 };
        continue;
      }
      const nb: ClosetItem = { id: "NEW", name: b.name, slot: b.slot, garment: b.garment };
      got[b.id] = {
        layers: rotation([...CLOSET, nb], STYLES).count - all.count,
        coreOnly: rotation([...CLOSET, nb], STYLES, { layers: false }).count - core.count,
      };
    }
    expect(got).toEqual(RX.next_buy_fits_added);
  });

  it("first 10 combos in Python's sorted(str) order", () => {
    expect(all.combos.slice(0, 10).map((k) => k.map((x) => (x ? [...x] : null)))).toEqual(RX.first_10_combos);
  });
});
