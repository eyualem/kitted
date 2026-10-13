// The founder's Oct 11 check (photo af7e93eb, DECISIONS-LOG #219): a green zip hoodie over a cream striped oxford,
// light-wash wide jeans and black/white basketball sneakers, at Class, going for streetwear. Readings only, no photo;
// profile pending (rule 7), so the test profile's picks are used next to his "going for streetwear".
// It scored 6.5, then 7.0 on a re-check of the identical photo. Three engine causes are pinned here:
//   (2) the oxford's "wrinkled" read (garment only "likely") cost 0.4 and flipped to "clean" on the re-read;
//   (3) the quick tap offered "Your White tee?" for a striped collared shirt;
//   (4) a hoodie worn as the outer layer wasn't a streetwear piece, so the outfit read as no style.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { askWithClosetParts, knownMatches, scoreParts, type KnownPiece, type PartsScored, type Reading } from "../src";
import { collarFamiliesDiffer, patternsDiffer } from "../src/closetIdentity";

interface Oct11 { occasion: string; first: Reading; recheckRaw: Reading; whiteTee: Omit<KnownPiece, "shoeKind" | "shoeKindSaid" | "confirmed" | "sightings"> }
const D = JSON.parse(readFileSync(join(__dirname, "data/phone-oct11-af7e93.json"), "utf8")) as Oct11;
const TEST_PROFILE = [["minimalist", 0.5], ["smart_casual", 0.5]] as never;
const opts = (styles: unknown = TEST_PROFILE) => ({ occasion: D.occasion as never, styles: styles as never });
const piece = (over: Partial<KnownPiece> = {}): KnownPiece => ({ ...D.whiteTee, shoeKind: null, shoeKindSaid: false, confirmed: true, sightings: 2, ...over });

describe("#219 his Oct 11 green hoodie fit", () => {
  it("(4) reads as streetwear: the hoodie worn as the jacket is a streetwear piece", () => {
    const r = scoreParts(D.first, opts()) as PartsScored;
    expect(r.detectedStyles).toContain("streetwear");
    expect(r.styleLabel).toBe("streetwear");
  });

  // parts v8 (#228): 8.0 (v7 7.5); what this guards is unchanged: both reads land on the same score
  it("(2) both reads of the identical photo score 8.0: the 'likely' oxford's wrinkles are a tip, not 0.4", () => {
    for (const styles of [TEST_PROFILE, [["streetwear", 1.0]]]) {
      const a = scoreParts(D.first, opts(styles)) as PartsScored;
      const b = scoreParts(D.recheckRaw, opts(styles)) as PartsScored;
      expect(a.overall).toBe(8.0);
      expect(b.overall).toBe(8.0);
      expect(a.rawScore).toBe(b.rawScore);
      expect(a.condition.deduction).toBe(0);
      expect(a.condition.display).toBe("clean");
      expect(a.condition.tips.map((t) => t.check)).toEqual(["C_unsure_wrinkled"]);
      expect(a.condition.tips[0]!.line).toBe("the oxford shirt might be wrinkled; not counted, it isn't clear enough in the photo");
      expect(b.condition.tips).toEqual([]);
    }
  });

  it("(2) a wrinkle read on a 'clear' garment still costs 0.4", () => {
    const sure: Reading = { ...D.first, garments: D.first.garments.map((g, i) => (i === 0 ? { ...g, certainty: "clear" } : g)) };
    const r = scoreParts(sure, opts()) as PartsScored;
    expect(r.condition.deduction).toBe(0.4);
    expect(r.condition.tips).toEqual([]);
  });

  it("(3) 'Your White tee?' is never offered for the striped oxford", () => {
    const oxford = D.first.garments[0]!;
    expect(knownMatches([piece()], oxford)).toEqual([]);
    // the collar family alone rules it out too (a piece with no pattern stored)
    expect(knownMatches([piece({ pattern: null })], oxford)).toEqual([]);
    // and the pattern alone (a solid white oxford is still not this striped one)
    expect(knownMatches([piece({ subcategory: "oxford_shirt", name: "White oxford" })], oxford)).toEqual([]);
    const q = askWithClosetParts(D.first, opts(), [piece()]);
    expect(q?.kind === "known" && q.knownId === D.whiteTee.id).toBe(false);
    expect(q?.question ?? null).not.toBe("Your White tee?");
  });

  it("(3) his own striped oxford agrees with the read, so nothing is asked about the top", () => {
    const mine = piece({ id: "C-ox", subcategory: "oxford_shirt", colorFamily: "off_white_cream", pattern: "stripes", name: "Cream striped oxford" });
    expect(knownMatches([mine], D.first.garments[0]!).map((p) => p.id)).toEqual(["C-ox"]);
    const q = askWithClosetParts(D.first, opts(), [mine]);
    expect(q === null || q.garmentIndex !== 0).toBe(true);
  });

  it("(3) the pattern and collar rules", () => {
    expect(patternsDiffer("stripes", "solid")).toBe(true);
    expect(patternsDiffer("stripes", "checks_plaid")).toBe(true);
    expect(patternsDiffer("graphic", "solid")).toBe(true);
    expect(patternsDiffer("other", "stripes")).toBe(false);
    expect(patternsDiffer("other", "solid")).toBe(true);
    expect(patternsDiffer("stripes", null)).toBe(false);
    expect(patternsDiffer("na", "solid")).toBe(false);
    expect(collarFamiliesDiffer("oxford_shirt", "tee")).toBe(true);
    expect(collarFamiliesDiffer("polo", "sweater")).toBe(true);
    expect(collarFamiliesDiffer("hoodie", "tee")).toBe(false); // look-alikes stay askable (his hoodie read as a tee, #115)
    expect(collarFamiliesDiffer("oxford_shirt", "flannel_shirt")).toBe(false);
  });
});
