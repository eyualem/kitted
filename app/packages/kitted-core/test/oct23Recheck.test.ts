// His Oct 23 re-check (#372): a black tee at the belt over light relaxed jeans with grey suede shoes, Going out, 7.5.
// The card promised 8.0 for "Swap to your green Champion sweatshirt" and for "Swap to your cream chunky sneakers". He
// put the sweatshirt on, kept the same shoes, and the re-check came back 7.5, saying he'd done both.
//  - The sweatshirt's 8.0 kept the tee's length: a closet swap copied `length` from the piece it replaced, so the
//    sweatshirt "ended at the belt" and kept the tee's waist credit (+1.5 Proportions). Its own reading says mid fly.
//  - The re-check counted the shoe swap because the same shoes were read as grey work boots, then tan chukkas.
// Readings and closet pieces from his phone (pull 20261023-221823). Profile (rule 7): born 2004 (22–25), picks
// streetwear, minimal, workwear.
import { describe, expect, it } from "vitest";
import {
  applyPartsFix, partsFixAsFix, partsRecheckOutcome, scoreParts, suggestPartsFixes,
  type ClosetItem, type Garment, type Reading,
} from "../src/index";

const base = {
  pattern: "solid", logo: "none", volume: 3, leg_shape: "na", hem: "na", tucked: "na", condition: "clean", certainty: "clear",
  length: "na", pattern_scale: "na", saturation: "na", sleeve_end: "na", strain: "none", distressed_by_design: false, shows_below_outer: false,
} as const;
const g = (x: Partial<Garment> & Pick<Garment, "category" | "subcategory" | "color_family">): Garment => ({ ...base, ...x }) as Garment;
const scene = { framing: "full_body", shoes_visible: true, people_count: 1, mirror_selfie: true, lighting: "good", clothed: "fully" };

const jeans = g({ category: "bottom", subcategory: "jeans", color_family: "denim_light", volume: 4, leg_shape: "relaxed", hem: "cuffed", saturation: "muted", distressed_by_design: true });
const first: Reading = {
  scene,
  garments: [
    g({ category: "top", subcategory: "tee", color_family: "black", tucked: "none", length: "at_belt" }),
    jeans,
    g({ category: "footwear", subcategory: "work_boot", color_family: "grey", certainty: "likely", saturation: "muted" }),
  ],
} as Reading;
const sweatshirt = g({ category: "top", subcategory: "sweatshirt", color_family: "green", logo: "small", volume: 4, tucked: "none", length: "mid_fly", saturation: "muted", sleeve_end: "at_wrist" });
// The re-check as merged: his sweatshirt, the first photo's jeans, the same shoes read again.
const merged: Reading = { scene, garments: [sweatshirt, jeans, g({ category: "footwear", subcategory: "suede_chukka", color_family: "tan_camel", certainty: "likely" })] } as Reading;

const closet: ClosetItem[] = [
  { id: "C-sweatshirt", name: "Green Champion sweatshirt", slot: "top", garment: sweatshirt },
  { id: "C-sneakers", name: "Cream chunky sneakers", slot: "shoes", garment: g({ category: "footwear", subcategory: "chunky_sneaker", color_family: "off_white_cream", logo: "small", certainty: "likely" }) },
];
const look = {
  version: "look1",
  u: { outer_kind: "tee_or_polo", outer_hem_at: "hip", under_present: "no", under_kind: "none", under_hem_at: "none", under_shows: "no" },
  l: { pant_end: "slight_break", covers_shoe: "partly" },
};
const opts = { occasion: "going_out", styles: [["streetwear", 0.5], ["minimalist", 0.25], ["workwear", 0.25]], boldness: "a_little", secondLook: look } as never;
const swapTop = { edits: [{ op: "swap_closet", slot: "top" }], itemId: "C-sweatshirt" } as never;

describe("a closet swap brings the piece's own cut (#372)", () => {
  it("the first check is 7.5", () => {
    expect(scoreParts(first, opts).overall).toBe(7.5);
  });

  it("the swapped-in sweatshirt keeps its own length (mid fly), not the tee's (at the belt)", () => {
    const r = applyPartsFix(first, swapTop, { closet })!;
    expect(r.garments[0]!.subcategory).toBe("sweatshirt");
    expect(r.garments[0]!.length).toBe("mid_fly");
    expect(r.garments[0]!.sleeve_end).toBe("at_wrist");
    expect(r.garments[0]!.tucked).toBe("none"); // how he wears it still comes from the photo
  });

  it("so the card no longer promises 8.0 for the sweatshirt: it scores what the re-check gave", () => {
    const fx = suggestPartsFixes(first, { ...(opts as object), closet });
    expect(fx.fixes.map((f) => f.copy)).not.toContain("Swap to your Green Champion sweatshirt");
    expect(scoreParts(applyPartsFix(first, swapTop, { closet })!, opts).overall).toBe(7.5);
    // The shoe swap still stands: the tee stays, so its waist credit is real.
    expect(fx.fixes.find((f) => f.itemId === "C-sneakers")?.to).toBe(8);
  });

  it("a piece read without a length (na) takes the current one, as before", () => {
    const noLength = [{ ...closet[0]!, garment: { ...sweatshirt, length: "na" } }] as ClosetItem[];
    expect(applyPartsFix(first, swapTop, { closet: noLength })!.garments[0]!.length).toBe("at_belt");
  });
});

describe("a re-check counts a closet swap only when that piece is in the photo (#372)", () => {
  // The card's two fix rows as stored that night (the top one no longer comes out of the engine).
  const shoes = partsFixAsFix(suggestPartsFixes(first, { ...(opts as object), closet }).fixes.find((f) => f.itemId === "C-sneakers")!);
  const top = { ...shoes, target: "closet_top", itemId: "C-sweatshirt", edits: [{ op: "swap_closet", slot: "top" }], copy: "Swap to your green Champion sweatshirt" } as never;

  it("the same shoes read differently are not the cream chunky sneakers", () => {
    const out = partsRecheckOutcome(first, [top, shoes], merged, opts, opts, closet)!;
    expect(out.doneFixes.map((f) => f.copy)).toEqual(["Swap to your green Champion sweatshirt"]);
    expect(out.after).toBe(7.5);
  });

  it("the cream chunky sneakers really on (read as white leather sneakers) count", () => {
    const on: Reading = { ...merged, garments: [merged.garments[0]!, jeans, g({ category: "footwear", subcategory: "white_leather_sneaker", color_family: "off_white_cream" })] };
    expect(partsRecheckOutcome(first, [top, shoes], on, opts, opts, closet)!.doneFixes).toHaveLength(2);
  });

  it("without the closet, any change in the slot counts, as before", () => {
    expect(partsRecheckOutcome(first, [top, shoes], merged, opts, opts)!.doneFixes).toHaveLength(2);
  });
});
