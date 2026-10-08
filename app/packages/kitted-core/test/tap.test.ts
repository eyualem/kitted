// The one quick tap's answer helpers (src/tap.ts): the founder's Oct 7 outfit, the invariant that an answer scores
// exactly what the question promised (every asking parity reading × occasion), and the re-check carry.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  applyTapAnswer, askQuestion, carryTapAnswer, clone, fixTargets, recheckMerge, recheckOutcome, score, suggestFixes, tapOrder, tapOrdinal,
  type Reading, type ScoredResult, type Styles,
} from "../src/index";
import { FIXTURES, loadJSON } from "./helpers";

const phone = JSON.parse(readFileSync(join(FIXTURES, "../../rubric/research/style-council/phone-checks-oct7.json"), "utf8")) as { reading: Reading }[];
const misread = phone[0]!.reading; // grey hoodie, black wide jeans read as "sweatpants" (likely), slides
const OCCASIONS = ["everyday", "class", "date", "going_out", "interview", "event", "gym", "home"] as const;

describe("the founder's outfit", () => {
  it("asks at Everyday; Jeans → 6.5 reads as streetwear, Sweatpants → 5.0; buttons in the question's order", () => {
    const q = askQuestion(misread, { occasion: "everyday" })!;
    expect(tapOrder(q).map((o) => [o.label, o.score])).toEqual([["Jeans", 6.5], ["Sweatpants", 5.0]]);
    const jeans = applyTapAnswer(misread, q, "jeans");
    const s = score(jeans) as ScoredResult;
    expect([s.overall, s.styleLabel, s.rulesFired]).toEqual([6.5, "streetwear", ["F4_hem_drags_over_slides"]]);
    expect(score(applyTapAnswer(misread, q, "sweatpants")).overall).toBe(5.0);
    expect(jeans.garments[1]!.certainty).toBe("likely"); // the answer changes the type only
    expect(misread.garments[1]!.subcategory).toBe("sweatpants"); // never edits its input
    expect(tapOrdinal(misread, q.garmentIndex)).toBe(0);
  });

  it("every occasion: Date 3.5 vs 5.5, Interview 3.0 vs 4.0, Gym and Home don't ask", () => {
    const pairs = OCCASIONS.map((o) => {
      const q = askQuestion(misread, { occasion: o });
      return q ? tapOrder(q).map((x) => x.score) : null;
    });
    expect(pairs).toEqual([[6.5, 5.0], [6.5, 5.0], [5.5, 3.5], [5.5, 3.5], [4.0, 3.0], [4.0, 3.0], null, null]);
  });
});

describe("an answer scores what the question promised", () => {
  const P = loadJSON<{ readings: Record<string, Reading>; cases: { reading: string; occasion: string; styles: [string, number][]; boldness: string; ask: unknown }[] }>("rubric_parity.json");
  it("every asking parity reading × occasion, both options; only the subcategory changes", () => {
    const asking = [...new Set(P.cases.filter((c) => c.ask !== null).map((c) => c.reading))];
    expect(asking.length).toBeGreaterThan(20);
    let checked = 0;
    const bad: string[] = [];
    for (const id of asking) {
      const r = P.readings[id]!;
      for (const occasion of OCCASIONS) {
        for (const styles of [null, [["streetwear", 1]]] as (Styles | null)[]) {
          const opts = { occasion, styles };
          const q = askQuestion(r, opts);
          if (!q) continue;
          expect(tapOrder(q).map((o) => o.group ?? o.value).join("/")).toBe(q.pair);
          for (const o of q.options) {
            const a = applyTapAnswer(r, q, o.value);
            checked++;
            if (score(a, opts).overall !== o.score) bad.push(`${id}@${occasion} ${o.value}: ${score(a, opts).overall} vs ${o.score}`);
            const changed = a.garments.flatMap((g, i) => Object.keys({ ...g, ...r.garments[i] }).filter((k) => JSON.stringify(g[k]) !== JSON.stringify(r.garments[i]![k])).map((k) => `${i}.${k}`));
            const was = r.garments[q.garmentIndex]!;
            const lifted = was.certainty === "unsure" ? [`${q.garmentIndex}.certainty`] : []; // he told us: unsure → likely
            if (o.value !== was.subcategory) expect(changed.sort()).toEqual([...lifted, `${q.garmentIndex}.subcategory`].sort());
            else expect(changed).toEqual(lifted);
          }
          const def = q.options.find((o) => o.value === q.default)!;
          // a skip keeps what was read (#125); only a lost shoe type ("other") skips to the best answer
          const asRead = q.options.find((o) => o.value === r.garments[q.garmentIndex]!.subcategory);
          if (asRead) expect(def).toBe(asRead);
          else expect(def.score).toBe(Math.max(...q.options.map((o) => o.score)));
        }
      }
    }
    expect(bad).toEqual([]);
    expect(checked).toBeGreaterThan(100);
  });
});

describe("carryTapAnswer: a re-check can't undo the answer", () => {
  const q = askQuestion(misread, { occasion: "everyday" })!;
  const answered = applyTapAnswer(misread, q, "jeans");
  const tap = { pair: q.pair, slot: q.slot, ordinal: tapOrdinal(misread, q.garmentIndex) };
  const fixes = suggestFixes(answered, { occasion: "everyday" }).fixes;

  it("the same misread again: carried to jeans; recheckMerge keeps 6.5 (without the carry it drops to 5.0)", () => {
    expect(fixTargets(fixes)).toEqual(["bottom.hem"]);
    const carried = carryTapAnswer(answered, tap, misread, fixTargets(fixes));
    expect(carried.garments[1]!.subcategory).toBe("jeans");
    expect(score(recheckMerge(answered, carried, fixTargets(fixes)).merged).overall).toBe(6.5);
    expect(score(recheckMerge(answered, misread, fixTargets(fixes)).merged).overall).toBe(5.0); // the bug it fixes
  });

  it("end to end: he cuffs the jeans, the re-check reads sweatpants again with a clean hem, and the score goes up", () => {
    const next = clone(misread);
    next.garments[1]!.hem = "no_break";
    const merged = recheckMerge(answered, carryTapAnswer(answered, tap, next, fixTargets(fixes)), fixTargets(fixes)).merged;
    const out = recheckOutcome(answered, fixes, merged)!;
    expect(out.before).toBe(6.5);
    expect(out.after).toBeGreaterThanOrEqual(6.5);
    expect(out.doneFixes.map((f) => f.copy)).toEqual(["Cuff them once"]);
  });

  it("copies the parent's CURRENT value, inside the pair only", () => {
    const asSweats = applyTapAnswer(misread, q, "sweatpants"); // he answered sweatpants
    const readJeans = applyTapAnswer(misread, q, "jeans");
    expect(carryTapAnswer(asSweats, tap, readJeans, []).garments[1]!.subcategory).toBe("sweatpants");
    const chinos = clone(misread);
    chinos.garments[1]!.subcategory = "chinos"; // a different piece: not this question's business
    expect(carryTapAnswer(answered, tap, chinos, [])).toBe(chinos);
    expect(carryTapAnswer(answered, tap, answered, [])).toBe(answered); // already agrees
  });

  it("not when a fix replaces the whole slot, and not when the slot is missing", () => {
    expect(carryTapAnswer(answered, tap, misread, ["bottom"])).toBe(misread);
    expect(carryTapAnswer(answered, tap, misread, ["*"])).toBe(misread);
    const noBottom: Reading = { ...clone(misread), garments: misread.garments.filter((g) => g.category !== "bottom") };
    expect(carryTapAnswer(answered, tap, noBottom, [])).toBe(noBottom);
  });

  it("tapOrdinal counts within the slot", () => {
    const two: Reading = { scene: {}, garments: [{ category: "bottom" }, { category: "top" }, { category: "bottom" }] };
    expect([0, 1, 2].map((i) => tapOrdinal(two, i))).toEqual([0, 0, 1]);
    expect(() => tapOrdinal(two, 5)).toThrow(RangeError);
    expect(() => applyTapAnswer(two, { garmentIndex: 9, field: "subcategory" }, "jeans")).toThrow(RangeError);
  });
});

describe("tap v2: the shoe question on the founder's Oct 8 phone checks (#120)", () => {
  interface PhoneCheck { check: string; photo: string; occasion: string; reading: Reading; truth_reading: Reading }
  const checks = loadJSON<PhoneCheck[]>("../../rubric/research/reading-accuracy/phone-checks-oct8.json");
  const at = (c: PhoneCheck) => ({ occasion: c.occasion as never });

  it("asks 'Boots, sneakers or slides?' when his boots were read 'other' or 'slides'; Boots lands on the truth's score", () => {
    const rows = checks.map((c) => {
      const q = askQuestion(c.reading, at(c));
      const boots = q?.kind === "shoes" ? q.options.find((o) => o.group === "boots")!.score : null;
      // the truth as he'd tell it: work boots, seen (an unsure shoe isn't scored at all)
      const truth = clone(c.truth_reading);
      for (const g of truth.garments) if (g.category === "footwear" && g.certainty === "unsure") g.certainty = "likely";
      return [c.photo, q?.question ?? null, boots, score(truth, at(c)).overall];
    });
    for (const [photo, question, boots, truth] of rows) {
      if (question === "Boots, sneakers or slides?") expect([photo, boots]).toEqual([photo, truth]);
    }
    const asked = rows.filter((r) => r[1] === "Boots, sneakers or slides?").map((r) => r[0]);
    expect(asked).toEqual(["b0f0c8", "8bc29d", "d6559a", "f07193", "e026de"]);
  });

  it("the slides misread (e026de): Boots 8.5, Skip keeps slides 7.5, and Boots picks work boots", () => {
    const c = checks.find((x) => x.photo === "e026de")!;
    const q = askQuestion(c.reading, at(c))!;
    expect(tapOrder(q).map((o) => [o.label, o.value, o.score])).toEqual([
      ["Boots", "work_boot", 8.5], ["Sneakers", "low_profile_sneaker", 8.5], ["Slides", "slides_sandals", 7.5],
    ]);
    expect(q.default).toBe("slides_sandals");
    expect(score(applyTapAnswer(c.reading, q, "work_boot"), at(c)).rulesFired).not.toContain("F4_hem_drags_over_slides");
  });

  it("a lost type ('other') skips to the best answer; an unsure shoe becomes 'likely' once answered", () => {
    const c = checks.find((x) => x.photo === "d6559a")!; // read "other", unsure
    const q = askQuestion(c.reading, at(c))!;
    const best = Math.max(...q.options.map((o) => o.score));
    expect(q.options.find((o) => o.value === q.default)!.score).toBe(best);
    const a = applyTapAnswer(c.reading, q, "work_boot");
    expect([a.garments[q.garmentIndex]!.subcategory, a.garments[q.garmentIndex]!.certainty]).toEqual(["work_boot", "likely"]);
  });

  it("never at the gym or home, never when the shoes aren't visible, and v4.0 (shoes off) never asks it", () => {
    const c = checks.find((x) => x.photo === "e026de")!;
    expect(askQuestion(c.reading, { occasion: "gym" })).toBeNull();
    expect(askQuestion(c.reading, { occasion: "home" })).toBeNull();
    expect(askQuestion({ ...c.reading, scene: { ...c.reading.scene, shoes_visible: false } }, at(c))).toBeNull();
    for (const x of checks) expect(askQuestion(x.reading, at(x), false)?.kind).toBeUndefined();
  });

  it("a re-check that reads his boots as slides again keeps 'work boots' (the carry spans the asked kinds)", () => {
    const c = checks.find((x) => x.photo === "e026de")!;
    const q = askQuestion(c.reading, at(c))!;
    const parent = applyTapAnswer(c.reading, q, "work_boot");
    const carried = carryTapAnswer(parent, { pair: q.pair, slot: "footwear", ordinal: tapOrdinal(c.reading, q.garmentIndex) }, clone(c.reading), []);
    expect(carried.garments[q.garmentIndex]!.subcategory).toBe("work_boot");
    expect(carryTapAnswer(parent, { pair: q.pair, slot: "footwear", ordinal: 0 }, clone(c.reading), ["footwear"]).garments[q.garmentIndex]!.subcategory).toBe("slides_sandals");
  });
});
