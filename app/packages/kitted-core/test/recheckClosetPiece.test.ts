// The founder's Oct 23 re-check (10:08 pm): the first check's card offered "Swap to your green Champion sweatshirt"
// and "Swap to your cream chunky sneakers"; he re-checked in the sweatshirt and his tan chukkas, and the card ticked
// both. A "Swap to your …" fix is done only when the new photo shows a piece that could be that one.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { partsRecheckOutcome, type ClosetItem, type Fix, type Reading } from "../src";
import { clone } from "../src/util";

interface Oct23 { occasion: string; first: Reading; merged: Reading; fixes: Fix[]; closet: ClosetItem[] }
const D = JSON.parse(readFileSync(join(__dirname, "data/phone-oct23-recheck.json"), "utf8")) as Oct23;
const opts = { occasion: D.occasion as never };
const pieces = { items: D.closet };
const cream = D.closet.find((c) => c.name === "Cream chunky sneakers")!;
const done = (merged: Reading, p: typeof pieces | null = pieces) =>
  (partsRecheckOutcome(D.first, D.fixes, merged, opts, undefined, p ?? undefined)?.doneFixes ?? []).map((f) => f.copy);
const withShoes = (shoe: Reading["garments"][number]): Reading => {
  const r = clone(D.merged);
  r.garments = r.garments.map((g) => (g.category === "footwear" ? clone(shoe) : g));
  return r;
};

describe("a re-check ticks a closet swap only for that piece (Oct 23)", () => {
  it("K1: his tan chukkas don't tick 'Swap to your cream chunky sneakers'; the sweatshirt swap still does", () => {
    expect(done(D.merged)).toEqual(["Swap to your green Champion sweatshirt"]);
  });

  it("K2: wearing the cream chunky sneakers ticks both", () => {
    expect(done(withShoes(cream.garment))).toEqual(["Swap to your green Champion sweatshirt", "Swap to your cream chunky sneakers"]);
  });

  it("K3: a near read of the same pair (cream read as white) still counts", () => {
    expect(done(withShoes({ ...cream.garment, color_family: "white" }))).toContain("Swap to your cream chunky sneakers");
  });

  it("K4: a piece no longer in the closet falls back to the slot changing, as before", () => {
    expect(done(D.merged, { items: D.closet.filter((c) => c.id !== cream.id) })).toContain("Swap to your cream chunky sneakers");
  });

  it("K5: with no closet given, the outcome is exactly the old one", () => {
    expect(done(D.merged, null)).toEqual(["Swap to your green Champion sweatshirt", "Swap to your cream chunky sneakers"]);
  });

  it("K6: the score side doesn't move: before, after and the raw delta are the same with or without the closet", () => {
    const a = partsRecheckOutcome(D.first, D.fixes, D.merged, opts)!;
    const b = partsRecheckOutcome(D.first, D.fixes, D.merged, opts, undefined, pieces)!;
    expect([b.before, b.after, b.delta, b.rawDelta]).toEqual([a.before, a.after, a.delta, a.rawDelta]);
  });
});
