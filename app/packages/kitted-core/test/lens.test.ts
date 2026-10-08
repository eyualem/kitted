// "Scored for" (02 "S6s", #61): effects appear only when the style changed a rule.
import { describe, expect, it } from "vitest";
import { styleEffects, type Reading } from "../src/index";
import { loadReading } from "./helpers";

const oversized: Reading = {
  scene: { framing: "full_body", shoes_visible: true, clothed: "fully", people_count: 1 },
  garments: [
    { category: "top", subcategory: "hoodie", color_family: "black", volume: 5, length: "below_crotch", sleeve_end: "covers_hand" },
    { category: "bottom", subcategory: "jeans", color_family: "denim_dark", leg_shape: "relaxed", hem: "pooling" },
    { category: "footwear", subcategory: "chunky_sneaker", color_family: "white" },
  ],
};

describe("styleEffects", () => {
  it("no style: nothing to say", () => {
    expect(styleEffects(oversized, { occasion: "everyday", style: null }).effects).toEqual([]);
  });

  it("streetwear softens the oversized and pooling rules", () => {
    const r = styleEffects(oversized, { occasion: "everyday", style: "streetwear" });
    expect(r.effects.length).toBeGreaterThan(0);
    for (const e of r.effects) expect(e.withStyle).not.toBe(e.general);
    expect(r.effects.some((e) => e.withStyle < e.general)).toBe(true);
    expect(r.overall!).toBeGreaterThanOrEqual(r.overallGeneral!);
  });

  it("a plain outfit the style doesn't touch: empty", () => {
    const r = styleEffects(loadReading("p01b"), { occasion: "date", style: "smart_casual" });
    expect(r.effects).toEqual([]);
    expect(r.overall).toBe(r.overallGeneral);
  });
});
