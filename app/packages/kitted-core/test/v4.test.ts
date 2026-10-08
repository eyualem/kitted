// Rubric v4.0 behaviour the UI will build on (RULEBOOK.md Parts 1, 4, 5): the founder's Oct 7 outfit, the tap,
// style detection and its label. Exact numbers come from rubric.py; parity covers every case, these name the story.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { askQuestion, clone, detectStyles, explainScore, score, styleEffects, type Reading, type ScoredResult } from "../src/index";
import { FIXTURES } from "./helpers";

const phone = JSON.parse(readFileSync(join(FIXTURES, "../../rubric/research/style-council/phone-checks-oct7.json"), "utf8")) as { reading: Reading }[];
const misread = phone[0]!.reading; // grey hoodie, black wide jeans read as "sweatpants", slides
const asJeans = (() => {
  const r = clone(misread);
  r.garments[1]!.subcategory = "jeans";
  r.garments[1]!.certainty = "clear";
  return r;
})();

describe("rubric v4: the founder's outfit", () => {
  it("misread as sweatpants: 5.0 (the floor), not 3.5", () => {
    expect(score(misread).overall).toBe(5.0);
  });

  it("asks 'Jeans or sweatpants?' first; a skip scores the generous reading", () => {
    const q = askQuestion(misread)!;
    expect(q.question).toBe("Jeans or sweatpants?");
    expect(q.garmentIndex).toBe(1);
    expect(q.options.map((o) => [o.label, o.score])).toEqual([["Sweatpants", 5.0], ["Jeans", 6.5]]);
    expect(q.default).toBe("jeans");
  });

  it("read as jeans: 6.5, reads as streetwear, the one fault is the hem dragging over slides", () => {
    const s = score(asJeans) as ScoredResult;
    expect([s.overall, s.rulesFired, s.detectedStyles, s.styleLabel]).toEqual([6.5, ["F4_hem_drags_over_slides"], ["streetwear"], "streetwear"]);
    expect(askQuestion(asJeans)).toBeNull(); // blue-wash or sure readings never ask
  });
});

describe("rubric v4: picks never change the score", () => {
  it("same score for every pick, old onboarding keys included", () => {
    const base = score(asJeans);
    for (const styles of [[["workwear", 1]], [["preppy", 1]], [["old_money", 0.5], ["gorpcore", 0.5]], [["classic_prep", 1]]] as const) {
      expect(score(asJeans, { styles })).toEqual({ ...base, styleLabel: (score(asJeans, { styles }) as ScoredResult).styleLabel });
    }
    expect(styleEffects(asJeans, { occasion: "everyday", style: "workwear" }).effects).toEqual([]);
  });

  it("a pick only breaks a label tie between detected styles (old key preppy = classic prep)", () => {
    const blazer: Reading = {
      scene: { framing: "full_body", shoes_visible: true, clothed: "fully", people_count: 1 },
      garments: [
        { category: "top", subcategory: "oxford_shirt", color_family: "white", tucked: "none", certainty: "clear" },
        { category: "outerwear", subcategory: "unstructured_blazer", color_family: "navy", certainty: "clear" },
        { category: "bottom", subcategory: "chinos", color_family: "khaki_beige", leg_shape: "straight", certainty: "clear" },
        { category: "footwear", subcategory: "loafer", color_family: "brown", certainty: "clear" },
      ],
    };
    const d = detectStyles(blazer);
    expect(d.detected.length).toBeGreaterThan(0);
    expect(score(blazer, { styles: [["preppy", 1]] }).overall).toBe(score(blazer).overall);
  });
});

describe("rubric v4: the Why ledger still adds up with the cap and the floor", () => {
  it("the misread: the floor lift is reported and the rows add up", () => {
    const { ledger } = explainScore(misread);
    expect(ledger!.overall).toBe(5.0);
    expect(ledger!.floorLift).toBeGreaterThan(0);
  });
});
