// "Your green work boots?" (#126): the one quick tap about a piece he owns, on the founder's Oct 8 readings.
import { describe, expect, it } from "vitest";
import { applyTapAnswer, askQuestion, askWithCloset, clone, score, tapOrder, type KnownPiece, type Reading } from "../src";
import { loadJSON } from "./helpers";

interface PhoneCheck { photo: string; occasion: string; reading: Reading; truth_reading: Reading }
const checks = loadJSON<PhoneCheck[]>("../../rubric/research/reading-accuracy/phone-checks-oct8.json");
const check = (photo: string) => checks.find((c) => c.photo === photo)!;
const at = (c: PhoneCheck) => ({ occasion: c.occasion as never });
const shoeAt = (r: Reading) => r.garments.findIndex((g) => g.category === "footwear");

const BOOTS: KnownPiece = {
  id: "S-boots", slot: "shoes", colorFamily: "grey", subcategory: "work_boot", shoeKind: "boots", shoeKindSaid: true,
  name: "green work boots", confirmed: true, sightings: 3,
};
const HOODIE: KnownPiece = {
  id: "T-hoodie", slot: "top", colorFamily: "grey", subcategory: "hoodie", shoeKind: null, shoeKindSaid: false,
  name: "grey Nike hoodie", confirmed: true, sightings: 4,
};
/** His boots as the close-ups read them on Oct 8: a "likely" suede chukka or derby. */
const readAs = (c: PhoneCheck, sub: string, certainty = "likely") => {
  const r = clone(c.reading);
  Object.assign(r.garments[shoeAt(r)]!, { subcategory: sub, certainty });
  return r;
};

describe("askWithCloset: his confirmed boots", () => {
  it("no known pieces: exactly the rubric's question", () => {
    for (const c of checks) expect(askWithCloset(c.reading, at(c), [])).toEqual(askQuestion(c.reading, at(c)));
  });

  it("boots read 'other' (f07193): 'Your green work boots?' replaces the shoe question; Yes is the truth's score", () => {
    const c = check("f07193");
    const q = askWithCloset(c.reading, at(c), [BOOTS])!;
    expect([q.kind, q.question, q.knownId, tapOrder(q).map((o) => [o.label, o.value])]).toEqual([
      "known", "Your green work boots?", "S-boots", [["Yes", "work_boot"], ["No", "other"]],
    ]);
    expect(q.default).toBe("work_boot"); // a lost shoe skips to his piece
    expect(q.options[0]!.score).toBe(score(applyTapAnswer(c.reading, q, "work_boot"), at(c)).overall);
    expect(q.options[0]!.score).toBe(8.0);
  });

  it("the close-ups' split (a 'likely' chukka or derby): asks about his boots; Skip keeps the read", () => {
    const c = check("f07193");
    const r = readAs(c, "derby");
    expect(askQuestion(r, at(c))).toBeNull(); // the rubric alone never asks
    const q = askWithCloset(r, at(c), [BOOTS])!;
    expect([q.kind, q.default, q.options.map((o) => o.value)]).toEqual(["known", "derby", ["work_boot", "derby"]]);
    expect(q.swing).toBeGreaterThanOrEqual(0.5);
    // v4.1 (#186): his wide jeans aren't charged any more, so boots and chukkas score the same (8.0) here: nothing to ask.
    expect(askWithCloset(readAs(c, "suede_chukka"), at(c), [BOOTS])).toBeNull();
  });

  it("a sure read that disagrees is trusted: no question", () => {
    const c = check("f07193");
    expect(askWithCloset(readAs(c, "suede_chukka", "clear"), at(c), [BOOTS])).toBeNull();
  });

  it("his piece agrees with the read: the rubric's wasted 'Chelsea boots or work boots?' (d918c0) is dropped", () => {
    const c = check("d918c0");
    // v4.1 (#186): Chelsea vs work boots now moves him only 7.5 → 8.0, under the rubric's own bar, so it no longer asks.
    expect(askQuestion(c.reading, at(c))).toBeNull();
    expect(askWithCloset(c.reading, at(c), [BOOTS])).toBeNull();
  });

  it("slides read (e026de): a different kind, so the shoe question stands", () => {
    const c = check("e026de");
    expect(askWithCloset(c.reading, at(c), [BOOTS])).toEqual(askQuestion(c.reading, at(c)));
  });

  it("two pieces that fit: no known question (it would be a guess)", () => {
    const c = check("f07193");
    const twin = { ...BOOTS, id: "S-boots-2", subcategory: "chelsea_boot", name: "brown Chelsea boots" };
    expect(askWithCloset(c.reading, at(c), [BOOTS, twin])?.kind).not.toBe("known");
  });

  it("never at the gym or home, never when the shoes aren't visible", () => {
    const c = check("f07193");
    expect(askWithCloset(c.reading, { occasion: "gym" }, [BOOTS])).toBeNull();
    expect(askWithCloset({ ...c.reading, scene: { ...c.reading.scene, shoes_visible: false } }, at(c), [BOOTS])).toBeNull();
  });

  it("the hoodie read as a tee under a shirt (f07193, 'likely'): his boots question wins (the bigger swing, upward)", () => {
    const c = check("f07193");
    const q = askWithCloset(c.reading, at(c), [BOOTS, HOODIE])!;
    expect(q.knownId).toBe("S-boots");
    const onlyHoodie = askWithCloset(readAs(c, "work_boot", "clear"), at(c), [HOODIE]);
    if (onlyHoodie) expect([onlyHoodie.kind, onlyHoodie.question]).toEqual(["known", "Your grey Nike hoodie?"]);
  });

  it("every answer scores what it promised; same input, same question", () => {
    for (const c of checks) {
      for (const known of [[BOOTS], [HOODIE], [BOOTS, HOODIE]]) {
        const q = askWithCloset(c.reading, at(c), known);
        expect(askWithCloset(c.reading, at(c), known)).toEqual(q);
        if (!q) continue;
        for (const o of q.options) expect(score(applyTapAnswer(c.reading, q, o.value), at(c)).overall).toBe(o.score);
      }
    }
  });
});
