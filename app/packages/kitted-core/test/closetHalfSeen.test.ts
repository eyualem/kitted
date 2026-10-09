// Half-seen sightings (#115): a piece under another layer, or shoes the reading wasn't clear on, can't be ruled out by
// its shaky type / shape reads; it asks instead. Plus his Oct 8 checks replayed end to end (#110: 9 pieces for 5).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { decide, identity, lessonsOfYes, profileOf, reconcile, type ItemProfile, type Observation } from "../src/closetIdentity";
import { G } from "../src/names";

const obs = (o: Record<string, unknown>) => o as unknown as Observation;
const hoodieItem = () => profileOf("H", [obs({ ...G("top", "hoodie", "grey", { logo_text: "Nike swoosh", details: ["hood", "front_pouch"] }) })]);
const half = (sub: string, extra: Record<string, unknown> = {}) => obs({ ...G("top", sub, "grey"), partial: true, details: [], logo_text: "none", ...extra });

describe("half-seen sightings", () => {
  it("a tee read under a shirt: asks about his hoodie; seen clearly, a tee is still another piece", () => {
    expect(decide(half("tee"), [hoodieItem()])).toMatchObject({ outcome: "ask", candidateId: "H" });
    expect(decide(obs({ ...G("top", "tee", "grey"), details: [] }), [hoodieItem()]).outcome).toBe("new");
  });
  it("a hidden logo and hidden details cost nothing when half seen", () => {
    const codes = identity(half("hoodie"), hoodieItem()).reasons.map((r) => r.code);
    expect(codes.filter((c) => c.startsWith("detail_missing") || c.startsWith("no_logo"))).toEqual([]);
  });
  it("a half-seen sighting with negative points still asks (down to -4), never a silent new piece", () => {
    const d = decide(half("sweatshirt"), [profileOf("H", [obs({ ...G("top", "hoodie", "grey"), sampled_l: 30 })])].map((p) => p));
    expect(d.outcome).toBe("ask");
  });
  it("vetoes that still hold when half seen: a far color, a different brand he owns, his own 'different' answer", () => {
    expect(decide(half("tee", { color_family: "navy" }), [hoodieItem()]).outcome).toBe("new");
    expect(decide(half("hoodie", { logo_text: "Adidas" }), [hoodieItem()]).outcome).toBe("new");
    expect(decide(half("hoodie", { notItemIds: ["H"] }), [hoodieItem()]).outcome).toBe("new");
  });
  it("measured lightness: close adds a point, far costs points", () => {
    const item = profileOf("H", [obs({ ...G("top", "hoodie", "grey"), sampled_l: 30 })]);
    expect(identity(obs({ ...G("top", "hoodie", "grey"), sampled_l: 33 }), item).reasons.map((r) => r.code)).toContain("measured_same");
    expect(identity(obs({ ...G("top", "hoodie", "grey"), sampled_l: 50 }), item).reasons.map((r) => r.code)).toContain("measured_far");
  });
});

describe("lessonsOfYes", () => {
  it("his wide jeans read straight: both leg reads become his; a new type read becomes an alias", () => {
    const wide = obs(G("bottom", "jeans", "black", { leg_shape: "wide" }));
    const straight = obs(G("bottom", "jeans", "black", { leg_shape: "straight" }));
    expect(lessonsOfYes("jeans", [wide], straight)).toEqual({ aliases: [], fieldAliases: { leg_shape: ["straight", "wide"] } });
    expect(lessonsOfYes("hoodie", [obs(G("top", "hoodie", "grey"))], half("tee")).aliases).toEqual(["tee"]);
  });
});

describe("his Oct 8 checks, replayed (#110)", () => {
  interface Piece { truth: string; observation: Record<string, unknown>; sampledL: number; cropQuality: number }
  const data = JSON.parse(readFileSync(join(__dirname, "data/phone-oct8-closet.json"), "utf8")) as { checks: { pieces: Piece[] }[] };
  // The app's half-seen rule (features/closet/profile.ts isHalfSeen): shoes by the reading's certainty, the rest by crop.
  const halfSeen = (p: Piece) => (p.observation.category === "footwear" ? p.observation.certainty !== "clear" : p.cropQuality < 0.5);

  it("5 pieces for his 5, no wrong merge, at most 2 questions a check, answering truthfully", () => {
    type Item = { id: string; truth: string; sightings: Observation[]; aliases: string[]; fieldAliases: Record<string, string[]>; distinctFrom: string[] };
    const items: Item[] = [];
    const perCheck: number[] = [];
    let wrong = 0;
    for (const check of data.checks) {
      const observations = check.pieces.map((p) => obs({ ...p.observation, sampled_l: p.sampledL, partial: halfSeen(p) }));
      const profiles: ItemProfile[] = items.map((it) => profileOf(it.id, it.sightings, { aliases: it.aliases, distinctFrom: it.distinctFrom, fieldAliases: it.fieldAliases }));
      let asked = 0;
      for (const e of reconcile(observations, profiles)) {
        const p = check.pieces[e.index]!, o = observations[e.index]!;
        const target = items.find((it) => it.id === (e.itemId ?? e.candidateId));
        if (e.outcome === "same") {
          if (target!.truth !== p.truth) wrong++;
          target!.sightings.push(o);
        } else if (e.outcome === "ask" && target!.truth === p.truth) {
          asked++;
          const l = lessonsOfYes(String(target!.sightings[0]!.subcategory), target!.sightings, o, target!);
          Object.assign(target!, { aliases: l.aliases, fieldAliases: l.fieldAliases });
          target!.sightings.push(o);
        } else {
          if (e.outcome === "ask") asked++;
          items.push({ id: `P${items.length + 1}`, truth: p.truth, sightings: [o], aliases: [], fieldAliases: {}, distinctFrom: target ? [target.id] : [] });
        }
      }
      perCheck.push(asked);
    }
    expect(items.map((it) => it.truth).sort()).toEqual(["boots", "cream shirt", "gingham shirt", "hoodie", "jeans"]);
    expect(wrong).toBe(0);
    expect(Math.max(...perCheck)).toBeLessThanOrEqual(2);
    expect(perCheck.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(4);
  });
});
