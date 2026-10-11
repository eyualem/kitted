// The one quick tap for parts-scored checks (#212) on the founder's Oct 8 phone readings: the same questions as v4,
// but asked only when the PARTS score swings by v4's bar; the option scores are parts scores. v4 is untouched.
import { describe, expect, it } from "vitest";
import {
  applyTapAnswer, askQuestion, askQuestionParts, askWithCloset, askWithClosetParts, clone, partsOverall, scoreParts,
  type KnownPiece, type Reading, type TapQuestion,
} from "../src";
import { loadJSON } from "./helpers";

interface PhoneCheck { photo: string; occasion: string; reading: Reading }
const checks = loadJSON<PhoneCheck[]>("../../rubric/research/reading-accuracy/phone-checks-oct8.json");
const check = (photo: string) => checks.find((c) => c.photo === photo)!;
const at = (c: PhoneCheck) => ({ occasion: c.occasion as never });
const BOOTS: KnownPiece = {
  id: "S-boots", slot: "shoes", colorFamily: "grey", subcategory: "work_boot", shoeKind: "boots", shoeKindSaid: true,
  name: "green work boots", confirmed: true, sightings: 3,
};
const sum = (q: TapQuestion | null) => (q ? [q.kind ?? "pair", q.swing] : null);

describe("askQuestionParts: which questions ask, and each swing (parts score)", () => {
  // photo → [v4's question + swing, the parts question + swing]
  const want: Record<string, [unknown, unknown]> = {
    "a765e8": [["pair", 1.5], ["pair", 1.0]], // jeans read as sweatpants: 5.5 → 6.5 with parts (7.0 with v4)
    "6b14db": [["pair", 1.5], ["pair", 1.0]],
    "b0f0c8": [["shoes", 0.5], null], // boots lost at Everyday: no parts swing, so no question now
    "d6559a": [["shoes", 0.5], null],
    "8bc29d": [["shoes", 0.5], ["shoes", 0.5]],
    "f07193": [["shoes", 0.5], ["shoes", 0.5]],
    "e026de": [["shoes", 1.0], ["shoes", 0.5]],
    "5a9049": [null, null], "d918c0": [null, null], "0d39d6": [null, null],
  };
  for (const [photo, [v4, parts]] of Object.entries(want)) {
    it(`${photo}`, () => {
      const c = check(photo);
      expect(sum(askQuestion(c.reading, at(c)))).toEqual(v4);
      expect(sum(askQuestionParts(c.reading, at(c)))).toEqual(parts);
    });
  }

  it("every option's score is the parts score of that answer; the swing clears v4's bar", () => {
    let asked = 0;
    for (const c of checks) {
      const q = askQuestionParts(c.reading, at(c));
      if (!q) continue;
      asked++;
      const base = partsOverall(c.reading, at(c))!;
      for (const o of q.options) expect(o.score).toBe(scoreParts(applyTapAnswer(c.reading, q, o.value), at(c)).overall);
      if (q.kind === "shoes") expect(q.swing).toBeGreaterThanOrEqual(0.5);
      else expect(Math.abs(q.swing)).toBeGreaterThanOrEqual(1.0);
      expect(q.swing).toBe(Math.max(...q.options.map((o) => o.score)) - base);
    }
    expect(asked).toBe(5); // v4 asks on 7 of the 11
  });

  it("Skip keeps what was read; a lost type (other) skips to the best kind", () => {
    expect(askQuestionParts(check("a765e8").reading, at(check("a765e8")))!.default).toBe("sweatpants");
    expect(askQuestionParts(check("e026de").reading, at(check("e026de")))!.default).toBe("slides_sandals");
    expect(askQuestionParts(check("f07193").reading, at(check("f07193")))!.default).toBe("work_boot");
  });

  it("never at the gym or home, never when the shoes aren't visible", () => {
    const c = check("f07193");
    expect(askQuestionParts(c.reading, { occasion: "gym" })?.kind).not.toBe("shoes");
    expect(askQuestionParts(c.reading, { occasion: "home" })?.kind).not.toBe("shoes");
    expect(askQuestionParts({ ...c.reading, scene: { ...c.reading.scene, shoes_visible: false } }, at(c))).toBeNull();
  });

  it("a question that could raise beats one that could lower", () => {
    for (const c of checks) {
      const q = askQuestionParts(c.reading, at(c));
      if (q) expect(q.swing).toBeGreaterThan(0); // on his photos every question that asks could raise
    }
  });
});

describe("askWithClosetParts: 'Your green work boots?' by the parts swing", () => {
  it("no known pieces: exactly the parts question", () => {
    for (const c of checks) expect(askWithClosetParts(c.reading, at(c), [])).toEqual(askQuestionParts(c.reading, at(c)));
  });

  it("which known questions ask, and each swing", () => {
    const got = Object.fromEntries(checks.map((c) => [c.photo, [sum(askWithCloset(c.reading, at(c), [BOOTS])), sum(askWithClosetParts(c.reading, at(c), [BOOTS]))]]));
    expect(got.f07193).toEqual([["known", 0.5], ["known", 0.5]]); // 6.5 → 7.0 with parts
    expect(got["8bc29d"]).toEqual([["known", 0.5], ["known", 0.5]]);
    expect(got.b0f0c8).toEqual([["known", 0.5], null]); // boots or not, parts gives 7.0
    expect(got.d6559a).toEqual([["known", 0.5], null]);
    expect(got.e026de).toEqual([["shoes", 1.0], ["shoes", 0.5]]); // slides: a different kind, the shoe question stands
  });

  it("Yes is his piece at the parts score; a lost shoe skips to his piece", () => {
    const c = check("f07193");
    const q = askWithClosetParts(c.reading, at(c), [BOOTS])!;
    expect(q.options.map((o) => [o.label, o.value, o.score])).toEqual([["Yes", "work_boot", 7.0], ["No", "other", 6.5]]);
    expect(q.default).toBe("work_boot");
  });

  it("a swing under 0.5 with parts doesn't ask, even when v4's would", () => {
    const c = check("f07193");
    const r = clone(c.reading);
    const i = r.garments.findIndex((g) => g.category === "footwear");
    Object.assign(r.garments[i]!, { subcategory: "derby", certainty: "likely" });
    const v4 = askWithCloset(r, at(c), [BOOTS]);
    const p = askWithClosetParts(r, at(c), [BOOTS]);
    if (p) expect(Math.abs(p.swing)).toBeGreaterThanOrEqual(0.5);
    expect(v4?.kind).toBe("known");
  });
});
