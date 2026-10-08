// Weather bands (02 "S1d", DECISIONS-LOG #58): every band edge, and weather never touches a score.
import { describe, expect, it } from "vitest";
import { clone, score, seasonNeeds, weatherNeeds, weatherTip, type DayWeather, type Reading } from "../src/index";
import { loadReading } from "./helpers";

const day = (feelsLowF: number, feelsHighF = feelsLowF, precipChance = 0): DayWeather => ({
  window: "day", nowF: feelsLowF, highF: feelsHighF, lowF: feelsLowF, feelsLowF, feelsHighF, precipChance,
  precipFromHour: precipChance >= 0.5 ? 17 : null, condition: precipChance >= 0.5 ? "rain" : "clear",
});

describe("weatherNeeds bands", () => {
  it.each([
    [80, "none"], [79, "none"], [65, "none"], [64, "suggested"], [50, "suggested"], [49, "required"], [35, "required"], [34, "outer"],
  ] as const)("feels-like %i → %s", (f, layer) => {
    expect(weatherNeeds(day(f)).layer).toBe(layer);
  });

  it("hot and shorts only when the whole window is warm", () => {
    expect(weatherNeeds(day(70, 82))).toMatchObject({ hot: true, shortsOk: true });
    expect(weatherNeeds(day(66, 79))).toMatchObject({ hot: false, shortsOk: false });
    expect(weatherNeeds(day(60, 85))).toMatchObject({ hot: false, shortsOk: false });
  });

  it("rain at 50% and up", () => {
    expect(weatherNeeds(day(60, 60, 0.49)).wet).toBe(false);
    expect(weatherNeeds(day(60, 60, 0.5)).wet).toBe(true);
  });

  it("a removable layer on a 15° swing", () => {
    expect(weatherNeeds(day(48, 62)).removable).toBe(false);
    expect(weatherNeeds(day(48, 63)).removable).toBe(true);
    expect(weatherNeeds(day(66, 90)).removable).toBe(false); // no layer to remove
  });

  it("season fallback stays conservative", () => {
    expect(seasonNeeds(1).layer).toBe("required");
    expect(seasonNeeds(10).layer).toBe("suggested");
    expect(seasonNeeds(7).layer).toBe("none");
    expect(seasonNeeds(7).hot).toBe(false);
  });
});

describe("weatherTip", () => {
  const withShoes = (sub: string, color = "brown"): Reading => ({
    scene: { framing: "full_body" },
    garments: [
      { category: "top", subcategory: "tee", color_family: "white" },
      { category: "bottom", subcategory: "jeans", color_family: "denim_dark" },
      { category: "footwear", subcategory: sub, color_family: color },
    ],
  });

  it("names suede and light shoes on a wet day", () => {
    expect(weatherTip(withShoes("suede_chukka"), day(60, 66, 0.7))?.key).toBe("wetSuede");
    expect(weatherTip(withShoes("white_leather_sneaker", "white"), day(60, 66, 0.7))?.key).toBe("wetLight");
    expect(weatherTip(withShoes("chelsea_boot", "black"), day(60, 66, 0.7))).toBeNull();
  });

  it("cold with no layer, freezing with no coat, hot with a jacket", () => {
    expect(weatherTip(withShoes("loafer"), day(40))?.key).toBe("coldNoLayer");
    const r = withShoes("loafer");
    r.garments.push({ category: "outerwear", subcategory: "overshirt", color_family: "navy" });
    expect(weatherTip(r, day(20))?.key).toBe("coldNoCoat");
    expect(weatherTip(r, day(75, 88))?.key).toBe("hotLayer");
    expect(weatherTip(r, null)).toBeNull();
  });

  it("never changes the score (same photo, same score on any day)", () => {
    const reading = loadReading("p01a");
    const before = score(clone(reading), { occasion: "date" });
    const copy = clone(reading);
    for (const w of [day(20), day(90, 95), day(55, 70, 0.9)]) weatherTip(copy, w);
    expect(copy).toEqual(reading);
    expect(score(copy, { occasion: "date" })).toEqual(before);
  });
});
