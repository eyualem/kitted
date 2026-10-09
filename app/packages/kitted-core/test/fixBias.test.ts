// The layer bias (DECISIONS-LOG #160): a clean outfit used to get "Add a layer" or nothing. On the founder's
// Oct 8–9 phone readings (readings only, no photos) plus made-up outfits, the fix list must match
// kitted_logic.suggest_fixes exactly (test/data/phone-fixes-oct9.json, empty closet, no style picks).
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { suggestFixes, type Reading } from "../src/index";

const here = dirname(fileURLToPath(import.meta.url));
const D = JSON.parse(readFileSync(resolve(here, "data/phone-fixes-oct9.json"), "utf8")) as {
  cases: { id: string; reading: Reading; occasion: string; warm: boolean; expected: { target: string; copy: string; to: number; effort: number }[] }[];
};
const find = (id: string) => D.cases.find((c) => c.id === id)!;
const run = (c: (typeof D.cases)[number]) =>
  suggestFixes(c.reading, { occasion: c.occasion, warm: c.warm }).fixes.map((f) => ({ target: f.target, copy: f.copy, to: f.to, effort: f.effort }));

describe("fix choices match the Python reference (#160)", () => {
  for (const c of D.cases) it(c.id, () => expect(run(c)).toEqual(c.expected));
});

describe("what the founder sees (#160)", () => {
  it("black Nike hoodie + wide jeans + slides: the shoes lead, the layer is a jacket, never a button-up", () => {
    const got = run(find("phone-1f1997@class"));
    expect(got.map((f) => f.copy)).toEqual(["Swap the slides for chunky sneakers", "Add a jacket over it: denim, bomber or chore coat"]);
  });
  it("a warm day drops the layer (and boots); a tee + shorts in July gets no 'Add a layer'", () => {
    expect(run(find("summer tee + chino shorts + white leather@everyday#warm"))).toEqual([]);
    expect(run(find("phone-968016@class#warm"))).toEqual([]);
  });
  it("a shoe swap is never sneakers for look-alike sneakers, and the smallest dressiness change wins a tie", () => {
    expect(run(find("overshirt + tee + chinos + loafers@class")).map((f) => f.copy)).toEqual(["Swap the loafers for white leather sneakers"]);
  });
});
