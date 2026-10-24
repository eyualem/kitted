// The same clothes, the same read, minutes apart (09-ui-review §29, #380). His Oct 24 pull (20261024-153001); profile
// (rule 7): born 2004 (22–25), picks streetwear, minimal, workwear; this check going for streetwear, everyday.
//  - A1–A5: the re-check credits a fix with what the fix did (partsRecheckOutcome's fixTo / readParts).
//  - C1–C7: the closet settles a slot toward the piece from the same outfit minutes ago (reconcileReading's `same`).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  partsFixAsFix, partsRecheckOutcome, reconcileReading, scoreParts, suggestPartsFixes, profileOf, sameOutfitMatch,
  type ClosetItem, type Fix, type Garment, type Observation, type Reading, type StoredProfile,
} from "../src/index";
import { G } from "../src/names";

const D = JSON.parse(readFileSync(new URL("./data/phone-oct24-recheck.json", import.meta.url), "utf8")) as {
  first: { reading: Reading; secondLook: { u: Record<string, string>; l: Record<string, string> }; fixes: Fix[]; score: number };
  recheck: { merged: Reading; ownLook: { u: Record<string, string>; l: Record<string, string> }; storedScore: number };
  closet: ClosetItem[];
  opts: { occasion: string; styles: [string, number][]; boldness: string };
};
const input = (sl: { u: Record<string, string>; l: Record<string, string> }) => ({
  under_present: sl.u.under_present, under_shows: sl.u.under_shows, covers_shoe: sl.l.covers_shoe,
});
const firstOpts = { ...D.opts, secondLook: input(D.first.secondLook) } as never;
const ownOpts = { ...D.opts, secondLook: input(D.recheck.ownLook) } as never;

describe("A · the re-check credits a fix with what the fix did (#380)", () => {
  it("his stored numbers: the first check 6.5, the re-check 8.0 with its own look (a_little)", () => {
    expect(scoreParts(D.first.reading, firstOpts).overall).toBe(6.5);
    expect(scoreParts(D.recheck.merged, ownOpts).overall).toBe(8);
    expect(D.recheck.storedScore).toBe(8);
  });

  it("A1: the sneaker swap earns its own move (7.5, what the card promised), the rest is the photo read differently, in Proportions", () => {
    const out = partsRecheckOutcome(D.first.reading, D.first.fixes, D.recheck.merged, firstOpts, ownOpts, D.closet)!;
    expect(out.doneFixes.map((f) => f.copy)).toEqual(["Swap to your cream chunky sneakers"]);
    expect(out.before).toBe(6.5);
    expect(out.after).toBe(8);
    expect(out.fixTo).toBe(7.5);
    expect(D.first.fixes[0]!.to).toBe(7.5);
    expect(out.readParts).toEqual(["proportions"]);
    // Before #380 the one caught fix earned the whole raw move (1.325); now its own.
    expect(out.doneFixes[0]!.earned).toBeLessThan(out.rawDelta);
    expect(out.doneFixes[0]!.earned).toBeGreaterThan(0);
  });

  it("A2: when nothing else was read differently, the fix carries the whole move", () => {
    const same = partsRecheckOutcome(D.first.reading, D.first.fixes, D.recheck.merged, firstOpts, firstOpts, D.closet)!;
    // With the first check's look on both sides only the shoes differ (the hoodie's re-read doesn't move a part).
    expect(same.fixTo).toBe(same.after);
    expect(same.readParts).toBeUndefined();
  });

  it("A4: no fix caught: no split (nothing to credit)", () => {
    const none = partsRecheckOutcome(D.first.reading, D.first.fixes, D.first.reading, firstOpts, ownOpts, D.closet)!;
    expect(none.doneFixes).toHaveLength(0);
    expect(none.fixTo).toBeUndefined();
  });

  it("a fix that changes the layers takes the re-check's own look U for its number (a tuck can hide the peek)", () => {
    const fx = suggestPartsFixes(D.first.reading, { ...(firstOpts as object), closet: D.closet }).fixes.map(partsFixAsFix);
    const swapTop = { ...fx[0]!, target: "x", edits: [{ op: "swap_closet", slot: "top" }], itemId: undefined, copy: "Swap the top" } as unknown as Fix;
    const hoodieOff: Reading = { ...D.recheck.merged, garments: D.recheck.merged.garments.map((g) => (g.category === "top" ? { ...g, subcategory: "tee", color_family: "black" } : g)) as Garment[] };
    const out = partsRecheckOutcome(D.first.reading, [swapTop], hoodieOff, firstOpts, ownOpts)!;
    // The fix's number scores with the re-check's U (a_little), so nothing is left over as a read change in Proportions.
    expect(out.readParts ?? []).not.toContain("proportions");
  });
});

// ---------------------------------------------------------------- the closet, the same outfit minutes ago
const top = (color: string, l: number | null, x: Partial<Observation> = {}) => G("top", "hoodie", color, { sampled_l: l, ...x }) as Observation;
const jeans = (color: string, l: number | null, x: Partial<Observation> = {}) => G("bottom", "jeans", color, { leg_shape: "wide", sampled_l: l, ...x }) as Observation;
const shoe = (sub: string, color: string, l: number | null) => G("footwear", sub, color, { sampled_l: l }) as Observation;
const item = (id: string, name: string, slot: string, g: Observation): ClosetItem => ({ id, name, slot, garment: g as Garment });
const reading = (...gs: Observation[]): Reading => ({ scene: { lighting: "good" }, garments: gs as Garment[] }) as Reading;
const prof = (sightings: Observation[]): StoredProfile => ({ sightings });

// His closet as of 15:20 on Oct 24, in his own words: the hoodie, the sneakers, and the light jeans twice.
const hoodieI = item("C-hoodie", "Charcoal Nike hoodie", "top", top("charcoal", 40));
const sneakI = item("C-sneak", "Cream chunky sneakers", "shoes", shoe("chunky_sneaker", "off_white_cream", 80));
const lightI = item("C-light", "Light jeans", "bottom", jeans("denim_light", 38.4));
const midI = item("C-mid", "Mid-wash jeans", "bottom", jeans("denim_mid", 30));
const closet = [hoodieI, sneakI, lightI, midI];
const profiles: Record<string, StoredProfile> = {
  "C-hoodie": prof([top("charcoal", 40)]), "C-sneak": prof([shoe("chunky_sneaker", "off_white_cream", 80)]),
  "C-light": prof([jeans("denim_light", 38.4), jeans("denim_light", 41)]), "C-mid": prof([jeans("denim_mid", 30), jeans("denim_mid", 37)]),
};
// FC-81230e66 at 15:19: the hoodie, the light jeans, the sneakers.
const recent = [{ itemId: "C-hoodie", sampledL: 40 }, { itemId: "C-light", sampledL: 38.4 }, { itemId: "C-sneak", sampledL: 80 }];
const decision = (r: Reading, same?: Parameters<typeof reconcileReading>[3], c = closet, p = profiles) =>
  reconcileReading(r, c, p, same).map((e) => ({ outcome: e.outcome, id: e.itemId ?? e.candidateId, runnerUp: e.runnerUpId, same: !!e.sameOutfit }));

describe("C · the closet and the same outfit minutes ago (#380)", () => {
  // FC-f4d128a9 at 15:20: the same hoodie and sneakers; the jeans' color word flipped to mid, measured L* 37.6.
  const f4d = reading(top("charcoal", 41), jeans("denim_mid", 37.6), shoe("chunky_sneaker", "off_white_cream", 79));

  it("C1 before: the jeans went silently to the mid-wash pair", () => {
    expect(decision(f4d)[1]).toMatchObject({ outcome: "same", id: "C-mid" });
  });

  it("C1: now a question between his light jeans (from a minute ago) and the mid-wash pair", () => {
    expect(decision(f4d, { recent })[1]).toEqual({ outcome: "ask", id: "C-light", runnerUp: "C-mid", same: true });
    // the other pieces are untouched
    expect(decision(f4d, { recent })[0]).toMatchObject({ outcome: "same", id: "C-hoodie", same: false });
  });

  it("C2: his grey chukkas read tan 12 s later (L* 10.7 vs 12.8), same sweatshirt and jeans: the chukkas, no new piece", () => {
    const sw = item("C-sw", "Green Champion sweatshirt", "top", G("top", "sweatshirt", "green", { sampled_l: 30 }) as Observation);
    const grey = item("C-grey", "Grey chukkas", "shoes", shoe("suede_chukka", "grey", 10.7));
    const c = [sw, lightI, grey];
    const p = { "C-sw": prof([sw.garment as Observation]), "C-light": profiles["C-light"]!, "C-grey": prof([shoe("suede_chukka", "grey", 10.7), shoe("suede_chukka", "grey", 31)]) };
    const r = reading(G("top", "sweatshirt", "green", { sampled_l: 31 }) as Observation, jeans("denim_light", 27), shoe("suede_chukka", "tan_camel", 12.8));
    expect(decision(r, undefined, c, p)[2]).toMatchObject({ outcome: "new" });
    const rec = [{ itemId: "C-sw", sampledL: 30 }, { itemId: "C-light", sampledL: 27 }, { itemId: "C-grey", sampledL: 10.7 }];
    expect(decision(r, { recent: rec }, c, p)[2]).toEqual({ outcome: "same", id: "C-grey", runnerUp: undefined, same: true });
    // A re-check: the sweatshirt and jeans already linked outside the plan count toward "the same outfit".
    const onlyShoes = reading(shoe("suede_chukka", "tan_camel", 12.8));
    expect(decision(onlyShoes, { recent: rec, linked: ["C-sw", "C-light"] }, [grey], { "C-grey": p["C-grey"] })[0]).toMatchObject({ outcome: "same", id: "C-grey" });
  });

  it("C3: a different outfit (fewer than 2 other pieces in common) changes nothing", () => {
    // His Oct 18 library picks 32 s apart: a charcoal tee alone vs a black long-sleeve tee under a flannel.
    const other = reading(top("charcoal", 41), jeans("denim_mid", 37.6), shoe("slides_sandals", "black", 5));
    const rec = [{ itemId: "C-hoodie", sampledL: 40 }, { itemId: "C-light", sampledL: 38.4 }];
    expect(decision(other, { recent: rec })).toEqual(decision(other));
  });

  it("C4: a real swap minutes apart (runners for the sneakers) is never linked to the shoes before", () => {
    const swapped = reading(top("charcoal", 41), jeans("denim_light", 38), shoe("performance_runner", "black", 5));
    const d = decision(swapped, { recent });
    expect(d[2]!.id).not.toBe("C-sneak");
    expect(d[2]!.same).toBe(false);
  });

  it("C5: same kind but measured 15+ L* apart: the engine decides, as today", () => {
    const far = reading(top("charcoal", 41), jeans("denim_mid", 60), shoe("chunky_sneaker", "off_white_cream", 79));
    expect(decision(far, { recent })[1]).toMatchObject({ same: false });
    const m = sameOutfitMatch(jeans("denim_mid", 60), profileOf("C-light", [jeans("denim_light", 38.4)]), 38.4)!;
    expect(m.nearL).toBe(false);
  });

  it("C6: a piece he said this isn't ('No, a different one') is never linked or asked this way", () => {
    const said = reading(top("charcoal", 41), jeans("denim_mid", 37.6, { notItemIds: ["C-light"] }), shoe("chunky_sneaker", "off_white_cream", 79));
    expect(decision(said, { recent })[1]).toMatchObject({ outcome: "same", id: "C-mid", same: false });
  });

  it("C7: no photo measured, or the earlier piece taken by another garment: unchanged", () => {
    const unmeasured = reading(top("charcoal", 41), jeans("denim_mid", null), shoe("chunky_sneaker", "off_white_cream", 79));
    expect(decision(unmeasured, { recent })).toEqual(decision(unmeasured));
    const twoJeans = reading(top("charcoal", 41), jeans("denim_light", 38.4), jeans("denim_mid", 37.6), shoe("chunky_sneaker", "off_white_cream", 79));
    const d = decision(twoJeans, { recent });
    expect(d[1]).toMatchObject({ outcome: "same", id: "C-light" });
    expect(d[2]!.id).not.toBe("C-light");
  });
});
