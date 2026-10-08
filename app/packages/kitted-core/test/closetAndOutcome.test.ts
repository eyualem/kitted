// Closet matching ("Added 4 to Closet"), the re-check outcome (done fixes, S21), excludeTargets, removeGarment.
import { describe, expect, it } from "vitest";
import {
  closetPlan, fixTargets, recheckMerge, recheckOutcome, removeGarment, score, suggestFixes, type Styles,
} from "../src/index";
import { loadReading, seedCloset } from "./helpers";

const DEMO: Styles = [["smart_casual", 0.5], ["workwear", 0.5]];
const opts = { occasion: "date", styles: DEMO };

describe("closetPlan", () => {
  it("p01b against the full seed closet: tee and sneakers match T1/S1; tan vs khaki chinos ask about B1; the held overshirt is new", () => {
    const plan = closetPlan(loadReading("p01b"), seedCloset());
    expect(plan.matched.map((m) => [m.from, m.index, m.itemId])).toEqual([["garment", 0, "T1"], ["garment", 2, "S1"]]);
    expect(plan.asks.map((a) => [a.from, a.index, a.candidateId, a.garment.subcategory])).toEqual([["garment", 1, "B1", "chinos"]]);
    expect(plan.toAdd.map((a) => [a.from, a.index, a.garment.subcategory])).toEqual([["held", 0, "overshirt"]]);
  });
  it("light grey vs charcoal hoodies never merge, on v3 fields alone", () => {
    const r = loadReading("p01b");
    const hoodie = (c: string) => ({ ...r.garments[0]!, subcategory: "hoodie", color_family: c });
    const closet = [{ id: "H1", name: "Light grey hoodie", slot: "top", garment: hoodie("light_grey") }];
    const plan = closetPlan({ ...r, garments: [hoodie("charcoal")], held_items: [] }, closet);
    expect([plan.matched, plan.asks, plan.toAdd.length]).toEqual([[], [], 1]);
  });
  it("with an empty closet all four pieces are added (first run: 'Added 4 to Closet')", () => {
    const plan = closetPlan(loadReading("p01b"), []);
    expect(plan.matched).toEqual([]);
    expect(plan.asks).toEqual([]);
    expect(plan.toAdd).toHaveLength(4);
  });
  it("a closet item matches at most one piece", () => {
    const r = loadReading("p01b");
    const twoTees = { ...r, garments: [r.garments[0]!, { ...r.garments[0]! }], held_items: [] };
    const plan = closetPlan(twoTees, seedCloset().filter((i) => i.id === "T1"));
    expect(plan.matched).toHaveLength(1);
    expect(plan.toAdd).toHaveLength(1);
  });
});

describe("recheckOutcome", () => {
  const first = loadReading("p01b");
  const fixes = suggestFixes(first, { ...opts, firstCheck: true }).fixes;

  it("p01b -> p01a: 8.0 -> 9.0, +1.0 shown, the overshirt fix done with +0.75", () => {
    const { merged } = recheckMerge(first, loadReading("p01a"), fixTargets(fixes), opts);
    const o = recheckOutcome(first, fixes, merged, opts)!;
    expect([o.before, o.after, o.delta, o.rawDelta]).toEqual([8.0, 9.0, 1.0, 0.75]);
    expect(o.doneFixes.map((f) => [f.target, f.copy, f.earned])).toEqual([["K1_layered", "Wear the overshirt, open", 0.75]]);
    expect(o.newProblems).toEqual([]);
    expect(o.notSeen).toBe(false);
  });
  it("the same photo again: change not seen, score stays 8.0", () => {
    const { merged } = recheckMerge(first, loadReading("p01b"), fixTargets(fixes), opts);
    const o = recheckOutcome(first, fixes, merged, opts)!;
    expect(o.after).toBe(8.0);
    expect(o.doneFixes).toEqual([]);
    expect(o.notSeen).toBe(true);
  });
  it("the real p01a reading (care issue read) reports the new problem", () => {
    const { merged } = recheckMerge(first, loadReading("variants/p01a_real"), fixTargets(fixes), opts);
    const o = recheckOutcome(first, fixes, merged, opts)!;
    expect(o.after).toBe(8.5);
    expect(o.newProblems).toEqual(["F7_care"]);
  });
});

describe("excludeTargets", () => {
  it("'Fix doesn't apply' on the overshirt hides it; nothing else qualifies for p01b at Date", () => {
    const all = suggestFixes(loadReading("p01b"), opts);
    const skipped = suggestFixes(loadReading("p01b"), { ...opts, excludeTargets: [all.fixes[0]!.target] });
    expect(all.fixes[0]!.target).toBe("K1_layered");
    expect(skipped.fixes.map((f) => f.target)).not.toContain("K1_layered");
  });
  it("an empty list changes nothing", () => {
    expect(suggestFixes(loadReading("s24"), { occasion: "everyday", styles: DEMO, excludeTargets: [] }))
      .toEqual(suggestFixes(loadReading("s24"), { occasion: "everyday", styles: DEMO }));
  });
});

describe("removeGarment", () => {
  it("returns a new reading without the piece; the original is untouched", () => {
    const r = loadReading("p01b");
    const before = JSON.stringify(r);
    const out = removeGarment(r, 2);
    expect(out.garments).toHaveLength(r.garments.length - 1);
    expect(JSON.stringify(r)).toBe(before);
    expect(score(out, opts).overall).not.toBeNull();
    expect(() => removeGarment(r, 9)).toThrow(RangeError);
  });
});
