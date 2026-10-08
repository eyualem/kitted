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
          expect(tapOrder(q).map((o) => o.value).join("/")).toBe(q.pair);
          for (const o of q.options) {
            const a = applyTapAnswer(r, q, o.value);
            checked++;
            if (score(a, opts).overall !== o.score) bad.push(`${id}@${occasion} ${o.value}: ${score(a, opts).overall} vs ${o.score}`);
            const changed = a.garments.flatMap((g, i) => Object.keys({ ...g, ...r.garments[i] }).filter((k) => JSON.stringify(g[k]) !== JSON.stringify(r.garments[i]![k])).map((k) => `${i}.${k}`));
            if (o.value !== r.garments[q.garmentIndex]!.subcategory) expect(changed).toEqual([`${q.garmentIndex}.subcategory`]);
            else expect(changed).toEqual([]);
          }
          const def = q.options.find((o) => o.value === q.default)!;
          expect(def.score).toBe(Math.max(q.options[0].score, q.options[1].score)); // a skip scores the generous reading
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
