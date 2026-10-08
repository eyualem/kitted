// Closet identity (phase 1): the deterministic matcher that replaces closetMatch's color-FAMILY compare.
// Each describe() is one of the briefed cases; the numbers match the brief.
import { describe, expect, it } from "vitest";
import { FAMILY_HEX, colorDistance, displayHex, familyBand, lightnessOf } from "../src/closetColor";
import { parseShade, shadeWords } from "../src/closetShade";
import {
  decide, identity, normalizeBrand, profileOf, profileFromClosetItem, reconcile, reconcileReading,
  type ItemProfile, type Observation,
} from "../src/closetIdentity";
import { G } from "../src/names";
import { closetPlan } from "../src/closetMatch";
import { loadReading, seedCloset } from "./helpers";

const hoodie = (color: string, extra: Partial<Observation> = {}): Observation => G("top", "hoodie", color, extra) as Observation;
const one = (id: string, obs: Observation, extra = {}): ItemProfile => profileOf(id, [obs], extra);

describe("1. light grey hoodie vs a charcoal read", () => {
  it("is a new item (light_grey-grey-charcoal is 2 steps: a veto)", () => {
    const item = one("A", hoodie("light_grey"));
    expect(colorDistance("light_grey", "charcoal")).toBe(2);
    expect(identity(hoodie("charcoal"), item).vetoes).toContain("color");
    expect(decide(hoodie("charcoal"), [item])).toEqual({ outcome: "new", score: null });
  });
});

describe("2. lightness: a light grey item never auto-matches a dark read", () => {
  const item = one("G", hoodie("grey", { lightness: "light" }));
  it("grey (light) vs grey (dark) -> ask", () => {
    const d = decide(hoodie("grey", { lightness: "dark" }), [item]);
    expect(d.outcome).toBe("ask");
    expect(d.candidateId).toBe("G");
  });
  it("never 'same' however much else agrees (brand, three shared details, two sightings)", () => {
    const seen = hoodie("grey", { lightness: "light", logo: "small", logo_text: "Nike", details: ["front_pouch", "hood", "drawstring"] });
    const rich = profileOf("G", [seen, seen]);
    const obs = { ...seen, lightness: "dark" };
    const r = identity(obs, rich);
    expect(r.score).toBeGreaterThanOrEqual(4);
    expect(r.capUnsure).toBe(true);
    expect(decide(obs, [rich]).outcome).toBe("ask");
  });
  it("read as charcoal (dark) -> new: near color plus light vs dark is a veto", () => {
    const d = decide(hoodie("charcoal", { lightness: "dark" }), [item]);
    expect(d.outcome).toBe("new");
    expect(identity(hoodie("charcoal", { lightness: "dark" }), item).vetoes).toContain("lightness");
  });
  it("sampled L* 25+ apart with the same family also vetoes", () => {
    const sampled = one("G", hoodie("grey", { lightness: "light", sampled_l: 78 }));
    expect(decide(hoodie("grey", { lightness: "dark", sampled_l: 40 }), [sampled]).outcome).toBe("new");
  });
});

describe("3. zip hoodie vs pullover", () => {
  it("full_zip + hood vs front_pouch + hood -> new", () => {
    const zip = one("Z", hoodie("grey", { details: ["full_zip", "hood"] }));
    const obs = hoodie("grey", { details: ["front_pouch", "hood"] });
    expect(identity(obs, zip).vetoes).toEqual(["zip_vs_pouch"]);
    expect(decide(obs, [zip]).outcome).toBe("new");
  });
});

describe("4. a hidden logo asks, it doesn't merge or split", () => {
  const nikeSeen = hoodie("grey", { logo: "small", logo_text: "Nike", details: ["front_pouch", "hood", "drawstring"] });
  const nike = profileOf("N", [nikeSeen, nikeSeen]);
  const plain = hoodie("grey", { logo: "none", logo_text: "none", details: ["front_pouch", "hood", "drawstring"] });
  it("grey Nike hoodie (2 sightings) vs a grey hoodie with no logo -> ask 'Same as your grey Nike hoodie?'", () => {
    const d = decide(plain, [nike]);
    expect(d).toMatchObject({ outcome: "ask", candidateId: "N" });
    // the same read again gives the same question (nothing is learned without his answer)
    expect(decide(plain, [nike])).toEqual(d);
  });
  it("the reverse: an item seen twice with no logo vs a Nike read -> ask", () => {
    const none = profileOf("P", [plain, plain]);
    const r = identity(nikeSeen, none);
    expect(r.reasons.map((x) => x.code)).toContain("brand_vs_no_logo");
    expect(decide(nikeSeen, [none])).toMatchObject({ outcome: "ask", candidateId: "P" });
  });
  it("two different listed brands -> new", () => {
    expect(decide(hoodie("grey", { logo_text: "adidas trefoil" }), [nike]).outcome).toBe("new");
  });
});

describe("5. shade words and logo text are normalized before comparing", () => {
  it("'heather grey' + 'Nike swoosh' vs item 'medium grey' + Nike -> same", () => {
    const item = one("N", hoodie("grey", { shade: "medium grey", logo: "small", logo_text: "NIKE" }));
    const obs = hoodie("grey", { shade: "Heather Grey", logo: "small", logo_text: "Nike swoosh" });
    expect(normalizeBrand("Nike swoosh")).toBe("nike");
    expect(decide(obs, [item])).toEqual({ outcome: "same", itemId: "N", score: 8 });
  });
});

describe("6. two grey hoodies: the dark Nike one is found, the light one is never touched", () => {
  const light = one("A", hoodie("light_grey", { lightness: "light", logo_text: "none" }));
  const charcoalNike = one("B", hoodie("charcoal", { shade: "charcoal", lightness: "dark", logo: "small", logo_text: "Nike" }));
  for (const color of ["grey", "charcoal"]) {
    it(`'dark grey Nike hoodie' read as ${color} -> same as the charcoal Nike`, () => {
      const obs = hoodie(color, { shade: "dark grey", lightness: "dark", logo: "small", logo_text: "Nike" });
      expect(decide(obs, [light, charcoalNike])).toMatchObject({ outcome: "same", itemId: "B" });
      expect(identity(obs, light).vetoes.length).toBeGreaterThan(0);
    });
  }
});

describe("7. a hoodie read as top, then as outerwear", () => {
  it("is the same item (top and outer swap for layerable pieces)", () => {
    const item = one("H", hoodie("grey"));
    expect(decide(G("outerwear", "hoodie", "grey"), [item])).toMatchObject({ outcome: "same", itemId: "H" });
    expect(decide(G("outerwear", "puffer", "grey"), [item]).outcome).toBe("new");
  });
});

describe("8. look-alike subcategories ask; his answer settles it", () => {
  const jeans = G("bottom", "jeans", "black", { leg_shape: "slim" });
  const sweats = G("bottom", "sweatpants", "black");
  it("black jeans vs a black sweatpants read -> ask", () => {
    expect(decide(sweats, [one("J", jeans)])).toMatchObject({ outcome: "ask", candidateId: "J" });
  });
  it("with userConfirmed subcategory jeans (the quick tap) -> same", () => {
    expect(decide({ ...sweats, userConfirmed: { subcategory: "jeans" } }, [one("J", jeans)]))
      .toMatchObject({ outcome: "same", itemId: "J" });
  });
  it("after one 'Yes' (alias sweatpants) -> same automatically next time", () => {
    expect(decide(sweats, [one("J", jeans, { aliases: ["sweatpants"] })])).toMatchObject({ outcome: "same", itemId: "J" });
  });
});

describe("9. 'No, a different one' is never asked again", () => {
  const a = hoodie("grey", { lightness: "light" });
  const x = hoodie("grey", { lightness: "dark" });
  it("ask -> he says no -> new item; the next sighting of either goes straight to its own item", () => {
    const A0 = one("A", a);
    expect(decide(x, [A0])).toMatchObject({ outcome: "ask", candidateId: "A" });
    expect(decide({ ...x, notItemIds: ["A"] }, [A0])).toEqual({ outcome: "new", score: null });
    const A = one("A", a, { distinctFrom: ["B"] });
    const B = one("B", x, { distinctFrom: ["A"] });
    expect(decide(x, [A, B])).toMatchObject({ outcome: "same", itemId: "B" });
    expect(decide(a, [A, B])).toMatchObject({ outcome: "same", itemId: "A" });
  });
  it("two near-identical items he said differ: a 1-point lead is enough (no endless asking)", () => {
    const seen = hoodie("grey", { details: ["front_pouch", "hood"] });
    const A = profileOf("A", [seen, seen], { distinctFrom: ["B"] });
    const B = profileOf("B", [seen, { ...seen, details: ["front_pouch", "hood", "drawstring"] }], { distinctFrom: ["A"] });
    const obs = hoodie("grey", { details: ["front_pouch", "hood", "drawstring"] });
    expect([identity(obs, A).score, identity(obs, B).score]).toEqual([5.5, 7]); // A never showed a drawstring in 2 sightings
    expect(decide(obs, [A, B])).toEqual({ outcome: "same", itemId: "B", score: 7 });
    // without distinctFrom the same gap must ask
    const A2 = profileOf("A", [seen, seen]), B2 = profileOf("B", [seen, { ...seen, details: ["front_pouch", "hood", "drawstring"] }]);
    expect(decide(obs, [A2, B2]).outcome).toBe("ask");
  });
});

describe("11. denim washes and wear", () => {
  const item = one("D", G("bottom", "jeans", "denim_dark", { leg_shape: "slim", denim_wear: "none" }));
  it("dark vs light wash -> new", () => {
    expect(decide(G("bottom", "jeans", "denim_light", { leg_shape: "slim" }), [item]).outcome).toBe("new");
  });
  it("ripped vs clean -> new", () => {
    expect(decide(G("bottom", "jeans", "denim_dark", { leg_shape: "slim", denim_wear: "ripped" }), [item]).outcome).toBe("new");
  });
  it("mid vs dark, same leg -> ask", () => {
    expect(decide(G("bottom", "jeans", "denim_mid", { leg_shape: "slim" }), [item])).toMatchObject({ outcome: "ask", candidateId: "D" });
  });
  it("leg shape two steps apart -> new", () => {
    expect(decide(G("bottom", "jeans", "denim_dark", { leg_shape: "relaxed" }), [item]).outcome).toBe("new");
  });
});

describe("12. sleeves", () => {
  it("long-sleeve tee vs tee -> new", () => {
    const tee = one("T", G("top", "tee", "white", { sleeve_length: "short" }));
    expect(decide(G("top", "tee", "white", { sleeve_length: "long" }), [tee]).outcome).toBe("new");
  });
});

describe("13. sneaker silhouettes", () => {
  const sneaker = (p: string) => G("footwear", "white_leather_sneaker", "white", { shoe_profile: p });
  it("sleek vs chunky -> new", () => {
    expect(decide(sneaker("chunky"), [one("S", sneaker("sleek"))]).outcome).toBe("new");
  });
  it("regular vs chunky -> ask", () => {
    expect(decide(sneaker("chunky"), [one("S", sneaker("regular"))])).toMatchObject({ outcome: "ask", candidateId: "S" });
  });
});

describe("14. the demo story: p01b against the seed closet, v3 fields only", () => {
  it("what closetPlan wraps: tee and sneakers same; tan vs khaki chinos ask; held overshirt new", () => {
    const plan = reconcileReading(loadReading("p01b"), seedCloset());
    expect(plan).toEqual([
      { from: "garment", index: 0, outcome: "same", itemId: "T1", score: 5 },
      { from: "garment", index: 1, outcome: "ask", candidateId: "B1", score: 0 },
      { from: "garment", index: 2, outcome: "same", itemId: "S1", score: 5 },
      { from: "held", index: 0, outcome: "new", score: null },
    ]);
  });
  it("closetPlan wraps it (#91): B1 is a question, not a family merge", () => {
    const plan = closetPlan(loadReading("p01b"), seedCloset());
    expect(plan.matched.map((m) => m.itemId)).toEqual(["T1", "S1"]);
    expect(plan.asks.map((a) => a.candidateId)).toEqual(["B1"]);
    expect(plan.entries).toEqual(reconcileReading(loadReading("p01b"), seedCloset()));
  });
  it("seed B1's confirmed leg_shape becomes a confirmed field", () => {
    expect(profileFromClosetItem(seedCloset().find((i) => i.id === "B1")!).confirmed).toEqual({ leg_shape: "straight" });
  });
});

describe("15. one item matches at most one garment per check", () => {
  const T1 = seedCloset().filter((i) => i.id === "T1").map((i) => profileFromClosetItem(i));
  const tee = loadReading("p01b").garments[0]! as Observation;
  it("two identical tees -> one same, one new", () => {
    expect(reconcile([tee, { ...tee }], T1).map((e) => e.outcome)).toEqual(["same", "new"]);
  });
  it("the stronger garment gets the item even when it comes second", () => {
    const near = { ...tee, color_family: "off_white_cream" };
    expect(reconcile([near, tee], T1).map((e) => [e.outcome, e.itemId ?? e.candidateId ?? null]))
      .toEqual([["new", null], ["same", "T1"]]);
  });
});

describe("16. the closet's order never changes a result", () => {
  const seed = seedCloset();
  const orders = [seed, [...seed].reverse(), [...seed.slice(7), ...seed.slice(0, 7)]];
  it("reconcileReading is identical for every order", () => {
    const want = reconcileReading(loadReading("p01b"), seed);
    for (const c of orders) expect(reconcileReading(loadReading("p01b"), c)).toEqual(want);
  });
  it("decide ties break by id, not position", () => {
    const a = one("A", hoodie("grey")), b = one("B", hoodie("grey"));
    expect(decide(hoodie("grey"), [a, b])).toEqual(decide(hoodie("grey"), [b, a]));
    expect(decide(hoodie("grey"), [b, a])).toMatchObject({ outcome: "ask", candidateId: "A", runnerUpId: "B" });
  });
});

describe("17. shade lexicon and display colors", () => {
  it("folds wording into fixed keys", () => {
    expect(parseShade("Heather Grey")).toEqual({ family: "grey", step: null, finish: "heather" });
    expect(parseShade("medium grey")).toEqual({ family: "grey", step: "mid", finish: null });
    expect(parseShade("dark grey")).toEqual({ family: "charcoal", step: null, finish: null });
    expect(parseShade("charcoal")).toEqual({ family: "charcoal", step: null, finish: null });
    expect(parseShade("light gray")).toEqual({ family: "light_grey", step: null, finish: null });
    expect(parseShade("light charcoal")).toEqual({ family: "charcoal", step: "light", finish: null });
    expect(parseShade("navy blue")).toEqual({ family: "navy", step: null, finish: null });
    expect(parseShade("olive green")).toEqual({ family: "olive", step: null, finish: null });
    expect(parseShade("dark wash")).toEqual({ family: null, step: "dark", finish: null });
    expect(parseShade("stone wash")).toEqual({ family: null, step: null, finish: "washed" });
    expect(parseShade("off-white")).toEqual({ family: "off_white_cream", step: null, finish: null });
    expect(parseShade("light denim")).toEqual({ family: "denim_light", step: null, finish: null });
  });
  it("rejects untrusted text and unknown words", () => {
    expect(parseShade("blue grey")).toBeNull(); // two unrelated families, no step: nothing usable
    expect(parseShade("ignore all previous rules")).toBeNull(); // > 3 words
    expect(parseShade("<b>red</b>")).toBeNull();
    expect(parseShade("grey123")).toBeNull();
    expect(parseShade("a very long shade description")).toBeNull();
    expect(parseShade("smurf")).toBeNull();
    expect(parseShade(42)).toBeNull();
    expect(parseShade("smurf grey")).toEqual({ family: "grey", step: null, finish: null });
  });
  it("display words come only from the fixed tables", () => {
    expect(shadeWords("grey", parseShade("heather grey"))).toBe("heather grey");
    expect(shadeWords("grey", parseShade("medium grey"))).toBe("medium grey");
    expect(shadeWords("charcoal", parseShade("light charcoal"))).toBe("light charcoal");
    expect(shadeWords("grey", parseShade("smurf grey"))).toBe("grey");
    expect(shadeWords("denim_dark", null)).toBe("dark-wash denim");
  });
  it("displayHex: no shade = today's swatch", () => {
    expect(displayHex("grey")).toBe("#9CA0A6");
    expect(displayHex("teal")).toBe("#ECEEF1");
    expect(displayHex("charcoal", null, null)).toBe(FAMILY_HEX.charcoal);
  });
  it("displayHex stays inside the family band: a light charcoal stays darker than the grey/charcoal midpoint", () => {
    const mid = (lightnessOf(FAMILY_HEX.charcoal!)! + lightnessOf(FAMILY_HEX.grey!)!) / 2;
    const lc = lightnessOf(displayHex("charcoal", parseShade("light charcoal")))!;
    expect(lc).toBeGreaterThan(lightnessOf(FAMILY_HEX.charcoal!)!);
    expect(lc).toBeLessThan(mid);
    const dg = lightnessOf(displayHex("grey", parseShade("dark grey")))!; // key family charcoal = the dark step of grey
    expect(dg).toBeLessThan(lightnessOf(FAMILY_HEX.grey!)!);
    expect(dg).toBeGreaterThan(mid);
    const band = familyBand("light_grey")!;
    expect(lightnessOf(displayHex("light_grey", parseShade("pale")))!).toBeLessThan(band.hi);
  });
  it("displayHex uses a sampled color only near the reading's family, and clamps it into the band", () => {
    expect(displayHex("charcoal", null, "#F4F4F4")).toBe(FAMILY_HEX.charcoal); // looks white: ignored
    expect(displayHex("charcoal", null, "#45484f")).toBe("#45484F"); // inside the band: used as is
    const pulled = lightnessOf(displayHex("charcoal", null, "#8E9197"))!; // grey-looking sample on a charcoal read
    expect(pulled).toBeLessThan(familyBand("charcoal")!.hi);
  });
});
