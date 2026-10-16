// The two-shot check (handoff/12-two-shot-check.md, #313), T3: what finishes a top-only check. A top-only reading
// (framing upper_only) drops its bottoms and shoes from scoring, so a shoe snap (mergeShoeSnap, which keeps the
// framing) can't finish it; only a bottom snap (mergeBottomSnap, framing becomes full body) can.
import { describe, expect, it } from "vitest";
import { mergeBottomSnap, mergeShoeSnap, partialLabel, scoreParts, type Reading } from "../src/index";
import { loadReading } from "./helpers";

const full = loadReading("p01b");
const topOnly: Reading = { ...full, scene: { ...full.scene, framing: "upper_only", shoes_visible: false } };
const bottomSnap: Reading = {
  ...full,
  scene: { ...full.scene, framing: "full_body", shoes_visible: true },
  garments: full.garments.filter((g) => g.category === "bottom" || g.category === "footwear"),
};

describe("T3: finishing a top-only check", () => {
  it("the top-only reading is a partial check: top only", () => {
    const r = scoreParts(topOnly);
    expect(r.partial).toBe(true);
    expect(partialLabel(r.notRated)).toBe("Partial check: top only");
  });

  it("a shoe snap leaves it top only and the score unchanged (the card offered it until #313)", () => {
    const r = scoreParts(mergeShoeSnap(topOnly, bottomSnap));
    expect(partialLabel(r.notRated)).toBe("Partial check: top only");
    expect(r.overall).toBe(scoreParts(topOnly).overall);
  });

  it("a bottom snap makes it a full check, scored exactly as the merged reading", () => {
    const merged = mergeBottomSnap(topOnly, bottomSnap);
    const r = scoreParts(merged);
    expect(r.partial).toBe(false);
    expect(r.notRated).toEqual([]);
    expect(r.overall).toBe(scoreParts(full).overall);
  });
});
