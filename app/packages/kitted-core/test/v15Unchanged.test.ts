// T69-G2: v15 stays byte-identical (tasks/T69/TESTING.md). The baselines were computed by the test writer from commit
// a2480b09 (before any T69 change: `git show a2480b09:<path>`), with the same canonical JSON as below: the untagged
// (v15) cases of parts_parity.json with the pool references and the reading resolved, in order (H15p); parts_fixes.json's
// v15 cases, resolved the same way (H15f); rules_conformance.json's v15 cases (H15c). A key that only states a default
// (absent, null, or engine "v15") is dropped before hashing, so a regenerated v15 case may carry `season: null` but not
// one changed value. TUNE15 is parts.json's `tune` at that commit; rollback15's tune is it plus the v16 knobs at their
// off values (parts_proto._OFF16, written into every older tune for the TS to read: IMPLEMENTATION.md Step 3).
import { afterEach, describe, expect, it } from "vitest";
import * as core from "../src/index";
import {
  allowedColors, applyTapAnswer, askQuestionParts, createParts, PARTS_DATA, partsDataFor, partsOverall, RESCORE_V16, scoreParts, setRescoreV16,
  suggestPartsFixes, type Garment, type PartsResult, type PartsScored, type Reading,
} from "../src/index";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { FIXTURES, loadJSON } from "./helpers";
import { canon, R, sha256, stripDefaults } from "./t69";

// T69's whole-case pins at a2480b09 (before T69 and T94); since T94 the check below uses NAMES15* and H94*.
const H15P = "a8b3c28cd3981000874d85db4c1749505f587ae671eff9de1b64db1a2c2358b9"; // 12,021 cases at a2480b09
const H15F = "e427e6b26b34fa264d70c742837b0be106d029b416e5718ccab9b8acf8754251"; // 30,412 cases
const H15C = "60dac8e76a6aa7a02b903becbc9f9ec60bfb55918c6bb3b52e1e8ce165313dbe"; // 501 cases
const N15P = 11576, N15F = 30202, N15C = 500; // T61: the filtered sets (see isTrigger)
// T94 (Tailored, merged after T69; T94's TESTING.md Disputes 4). T94 renames looks in v15 outputs (TL2: "reads as
// tailored", style_label "tailored", "tailored" among the detected looks) and adds v15 cases (a Tailored picks variant,
// 26 TLR conformance cases), so the hashes above, taken over whole cases, can't hold. Two hashes keep the guarantee:
// - NAMES: the same pre-T69 v15 cases (T94's additions left out) with every look name masked, "tailored" dropped from the
//   look lists and the label left out, hash to what a2480b09's do under the same mask: no number, check, tip or other
//   word of v15 moved, through T69 and T94 together;
// - H94: every v15 case, exactly, hashes to what T94's fixtures gave before T69 merged (27f02eed): merging T69 changed
//   nothing of v15, names included.
// Computed by T94's test writer from `git show a2480b09:` and `git show 27f02eed:` with the code below (Nov 18).
const NAMES15P = "4c99737aeb5a169d21e34a7f616766d6147f710e7f817e9814c528b371cce32f"; // re-pinned by T61 on the filtered set
const NAMES15F = "564000a1c0da45ee4716a6d76aa344613daf9987f1e2c8df0253c715f1220027";
const NAMES15C = "3de6002adc195b731c107a6b5abb74e3367ba200d0443e0fb84880b90e835b51";
const H94P = "ab23f6d930e0f919d22e8f1468c0f8eef3bc74b051f8e6f914ed4d77cd889db8"; // 12,102 cases (T61 filter; was 12,549 unfiltered at 27f02eed)
const H94F = "b566e40d65f0a547c6d325ff086d268e85771456f2779c58a147c107364a3cf5"; // 30,968 cases (T61 filter; was 31,183)
const H94C = "d76fbd3290329e2938cbe5a904fffb9de55bfe6d407334e044e60ab88c693a37"; // 526 cases (T61: SCO-6-ignored left out; was 527)
const N94P = 12102, N94F = 30968, N94C = 526;
const LOOK_WORDS = /\b(vintage sport|outdoor|workwear|streetwear|tailored|classic prep|minimal|smart casual)\b/g;
/** The look names masked (see above). */
function maskNames(x: unknown, key?: string): unknown {
  if (Array.isArray(x)) {
    if (key === "detected_styles" || key === "detected_has") return x.filter((s) => s !== "tailored");
    if (key === "fired") return x.filter((f) => !((f as { check?: string }).check === "H1_reads_as_style" && (f as { line?: string }).line === "reads as tailored")).map((v) => maskNames(v));
    return x.map((v) => maskNames(v));
  }
  if (x !== null && typeof x === "object") {
    const o: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(x as Record<string, unknown>)) {
      if (k === "style_label" || (k === "label" && v === "tailored")) continue;
      const m = maskNames(v, k);
      if ((k === "detected_has" || k === "fired") && Array.isArray(m) && m.length === 0 && Array.isArray(v) && v.length > 0) continue;
      o[k] = m;
    }
    return o;
  }
  return typeof x === "string" ? x.replace(/a matching suit/g, "reads as <look>").replace(LOOK_WORDS, "<look>") : x;
}
// T61 (not rated; T61's TASK.md Disputes): a reading with a trigger is allowed to change (NR8.1: a costume flag, a traditional
// main piece, a dress or skirt, an unsure top, jacket or pants after the framing and shoe filters, heels or traditional
// shoes) and the 17 `parts-edge:nr_*` cases are new. The pins below are taken over every other v15 case, so any
// non-trigger case that moves still fails them. Counts and hashes recomputed by the T61 test writer on the fixtures at
// 78230a2f (before the T61 build) with this same filter, and equal on the built fixtures.
function isTrigger(r: Reading | undefined): boolean {
  if (!r) return false;
  const scene = (r.scene ?? {}) as Record<string, unknown>;
  let gs = (r.garments ?? []).filter((g) => g.category !== "accessory") as Garment[];
  const sub = (g: Garment) => g.subcategory as string;
  if (scene["costume_or_uniform"] === true) return true;
  if (gs.some((g) => (g.category as string) === "traditional" && sub(g) !== "traditional_shoe")) return true;
  if (gs.some((g) => ["dress", "skirt"].includes(sub(g)))) return true;
  if (gs.some((g) => g.category === "footwear" && ["heels", "traditional_shoe"].includes(sub(g)))) return true;
  if ((r.garments ?? []).some((g) => (g.category as string) === "traditional" && sub(g) === "traditional_shoe")) return true;
  if (scene["shoes_visible"] === false) gs = gs.filter((g) => g.category !== "footwear");
  if (scene["framing"] === "upper_only") gs = gs.filter((g) => g.category !== "bottom" && g.category !== "footwear");
  return gs.some((g) => g.certainty === "unsure" && ["top", "outerwear", "bottom"].includes(g.category as string));
}
// The 25 readings T61's generators added (17 parts-edge nr_* outfits, 8 make_parity nr_edge cases), by their fixture id:
// every case on them (the case itself, its picks and second-look variants, its fixes) is new, none existed before T61.
const T61_NEW = new Set(["r0c69507390ed", "r140c38fee578", "r2c9a156c3573", "r2eec48bc1f43", "r40c93962716e", "r41af780fd3c4", "r442cb791d65c", "r494fb321154f", "r58c5d76ffb70", "r6bf72bddcd1f", "r6fbac5ed97b7", "r7f59dabbd6d8", "r906bf2bcc0a2", "r925257b22b56", "r929fbeb5727e", "r973ff12274fc", "r9d615c5b9c80", "r9dd7be593c3c", "raf40d17e2d50", "rb9172e0209b1", "rb9746c7c7a12", "rc80e908691a0", "rde988e222436", "re3b1cadb55b1", "reb5c0a3f480c"]);
const isNr = (c: object) => T61_NEW.has((c as { reading?: string }).reading as string);
const tailoredPick = (c: object) => (((c as { styles?: unknown }).styles as [string, number][] | undefined) ?? []).some(([k]) => k === "tailored");
// parts.json's tune at a2480b09 (v15, parts data 1.14.0)
const TUNE15 = {"pr1":1.5,"pr1_mirror_short":0.5,"pr1b":0.5,"pr2":1.5,"pr3":1,"prop_cap":2.5,"h1":0.5,"h2":0.5,"h2_suit":0.5,"h4":0,"cp1":0,"cp2":0.5,"cp5":0.5,"lightness":true,"color_cap":2,"suit_shoe":true,"earned":{"over":7.5,"rate":0.5,"cap":0.25,"gate":[6.5,7]},"solid_line":true,"pr4":1,"pr4_shoes":["basketball_sneaker","canvas_sneaker","chunky_sneaker","low_profile_sneaker","retro_runner"],"h4_graphic_street":false,"sw2":0.5,"pr4_legs":["relaxed","wide"],"pr4_signature_v3":false,"pr5":1,"pr5_layers":["chore_coat"],"pr5_bottoms":["cargos","jeans","work_pants"],"pr5_shoes":["chelsea_boot","suede_chukka","work_boot"],"pr6":0.5,"pr6_layers":["fleece","rain_jacket","shell_jacket"],"pr6_shoes":["trail_shoe"],"short_layers_extra":["track_jacket"],"sc_pair":true,"h2_pick_free":true,"sx":3,"sx_street_tops":["graphic_tee"],"sx_dressy":["blazer","cardigan","chinos","derby","dress_shirt","dress_shoe","knit_polo","loafer","overcoat","oxford_shirt","polo","rugby_shirt","sport_coat","suit_jacket","suit_trousers","trousers","unstructured_blazer"],"sx_min_dressy":2,"sx_quiet":{"minimalist":4,"smart_casual":3,"classic_prep":3},"pb":1.5,"pb_roomy_full":["minimalist","outdoor","streetwear","vintage_sport","workwear"],"pb_roomy_narrow":["outdoor"],"pb_wide_ok":["minimalist","outdoor","streetwear","vintage_sport","workwear"],"h2_any":true,"occ_target":{"event":[3,4]},"cond_clear_only":true,"sk1_soft":0.5,"lounge_style":0.5,"weights":{"proportions":0.3,"fit":0.15,"color":0.2,"shoes":0.15,"cohesion":0.2},"pr1_ribbed_loose":true,"pr2b":1,"penalty":{"under":6.5,"rate":0.5,"cap":1},"ff5_roomy":true,"ff7_loose":true,"pn_narrow":1,"pn_skinny":1,"pn_rip":0.5,"pr1_loose":1.5,"pr1_straight":0.5,"sd3_off":true,"sw3_off":true,"sk2_runner":5,"cl1":1.5,"tk1":2,"int_top":6,"int_hoodie":5,"dd_same":1,"gt1":1.5,"cl1_own":true,"pn_slim_soft":true,"cp1_dark":0.5,"h3_base_covered":true,"pn_lounge_skinny":2,"cl1_scale":true,"pn_fitted_vol":2,"ll1":1,"wr_look":true,"wr_half":0.2,"wr_knit_tailored":0.2,"wr_knit_clean":0.2,"sh_prop":true,"sh_shape":1,"sh_layer":1,"sh_cap":1.5,"sh_roomy_fitted":1.5,"sh_fitted":1,"sd1_any_sneaker":true,"goes_together":0.5,"tracksuit":0.5,"gym_runner_unheld":true,"sweatsuit_sign":true,"sweatsuit_shape":1,"look_sign":true,"kit_cap":6,"kit_fit_rate":0.5,"sw1_blocks_credit":true,"pr1_tucked_layer":true,"peek_clearly_only":true,"hl":1.5,"cp8":0.5};
// parts_proto._OFF16 (v16 off; T69's top-of-scale knobs at their defaults)
const OFF16 = { v16: false, v16_color: false, sty3_off: false, v16_alpha: 0.5, v16_beta: 0.25, curve: [1.0, 1.0, 7.0], v16_knit: 0.0,
  v16_h9_cap: false, v16_h7_cap: 5.5, taste: null, raw_cap: 9.5, curve_knee: null, stack_clean: null };

const RP = loadJSON<{ readings: Record<string, Reading> }>("rubric_parity.json").readings;

describe("v15 byte-identical (T69-G2)", () => {
  it("T69-G2 · the v15 cases are the same as before T69", () => {
    const P = loadJSON<{ pool: unknown[]; readings: Record<string, Reading>; tunes: Record<string, unknown>;
      cases: (Record<string, unknown> & { reading: string; tune?: string; expected: Record<string, unknown> })[] }>("parts_parity.json");
    const at = (i: unknown) => P.pool[i as number];
    const expand = (e: Record<string, unknown>) => {
      const out: Record<string, unknown> = { ...e };
      if (out["parts"]) out["parts"] = Object.fromEntries(Object.entries(out["parts"] as Record<string, number>).map(([k, i]) => [k, at(i)]));
      for (const k of ["condition", "occasion", "lowest", "weights_used"]) if (k in out) out[k] = at(out[k]);
      return out;
    };
    const v15p = P.cases.filter((c) => !c.tune && !isNr(c) && !isTrigger(P.readings[c.reading] ?? RP[c.reading])).map((c) => ({ ...stripDefaults(c, [["season"], ["graded_look"]]), expected: expand(c.expected),
      reading_value: P.readings[c.reading] ?? RP[c.reading] }));
    expect(v15p.length).toBe(N94P);
    expect(sha256(canon(v15p))).toBe(H94P);
    const pre94p = v15p.filter((c) => !tailoredPick(c)).map((c) => maskNames(c));
    expect(pre94p.length).toBe(N15P);
    expect(sha256(canon(pre94p))).toBe(NAMES15P);

    const F = loadJSON<{ pool: unknown[]; readings: Record<string, Reading>;
      cases: (Record<string, unknown> & { reading: string; tune?: string; engine?: string; expected: { fixes: number[]; smaller_step: number | null } })[] }>("parts_fixes.json");
    const v15f = F.cases.filter((c) => !c.tune && (c.engine ?? "v15") === "v15" && !isNr(c) && !isTrigger(F.readings[c.reading] ?? RP[c.reading])).map((c) => ({
      ...stripDefaults(c, [["season"], ["engine", "v15"], ["graded_look"]]),
      expected: { ...c.expected, fixes: c.expected.fixes.map((i) => F.pool[i]), smaller_step: c.expected.smaller_step === null ? null : F.pool[c.expected.smaller_step] },
      reading_value: F.readings[c.reading] ?? RP[c.reading],
    }));
    expect(v15f.length).toBe(N94F);
    expect(sha256(canon(v15f))).toBe(H94F);
    const pre94f = v15f.filter((c) => !tailoredPick(c)).map((c) => maskNames(c));
    expect(pre94f.length).toBe(N15F);
    expect(sha256(canon(pre94f))).toBe(NAMES15F);
    // the v16 fix cases are there too (after the v15 ones), so the slice above isn't the whole file by accident
    expect(F.cases.length).toBeGreaterThan(N15F);

    const C = loadJSON<{ cases: (Record<string, unknown> & { engine?: string })[] }>("rules_conformance.json");
    const v15c = C.cases.filter((c) => (c.engine ?? "v15") === "v15" && c["id"] !== "SCO-6-ignored").map((c) => stripDefaults(c, [["engine", "v15"], ["season"], ["graded_look"]]));
    expect(v15c.length).toBe(N94C);
    expect(sha256(canon(v15c))).toBe(H94C);
    const pre94c = v15c.filter((c) => !String(c["rule"]).startsWith("TLR-")).map((c) => maskNames(c));
    expect(pre94c.length).toBe(N15C);
    expect(sha256(canon(pre94c))).toBe(NAMES15C);
    expect(C.cases.length).toBeGreaterThan(N15C);
  }, 180_000);

  it("T69-G2 · rollback15 is v15's tune", () => {
    const rb = (PARTS_DATA as unknown as { rollback15?: unknown }).rollback15;
    expect(rb).toEqual({ engine: "v15", label: "parts-proto-15 (Oct 28, 2026)", version: "1.14.0", tune: { ...TUNE15, ...OFF16 } });
    const d = partsDataFor(true, true, false);
    expect([d.engine, d.label, d.version]).toEqual(["v15", "parts-proto-15 (Oct 28, 2026)", "1.14.0"]);
    expect(d.tune).toEqual({ ...TUNE15, ...OFF16 });
    // the same tables as the bundled v16 data: only the engine, label, version and tune differ
    const strip = (x: object) => { const o = { ...x } as Record<string, unknown>; for (const k of ["engine", "label", "version", "tune"]) delete o[k]; return o; };
    expect(strip(d)).toEqual(strip(PARTS_DATA));
    expect(PARTS_DATA.engine).toBe("v16");
    // every untagged parity case scored with the v15 engine equals its fixture: parts.parity.test.ts "matches every v15 case exactly"
  });

  describe("the switch", () => {
    afterEach(() => setRescoreV16(true)); // RESCORE_V16 is the live switch: restore the shipped value

    it("T69-G2 · with RESCORE_V16 off every default path is v15", () => {
      expect(RESCORE_V16).toBe(true);
      expect(core.PARTS_RUBRIC_VERSION).toBe("parts-2.0.0");
      const V15 = createParts(partsDataFor(true, true, false));
      const on = scoreParts(R("BRIGHTS"), { occasion: "everyday" }) as PartsScored;
      expect([on.engine, on.overall]).toEqual(["v16", 4.5]);
      setRescoreV16(false);
      expect(core.PARTS_RUBRIC_VERSION).toBe("parts-1.14.0");
      // the founder's Oct 7 phone check (reading only; demo screens 34-36): his black wide jeans read as sweatpants
      const ph1file = JSON.parse(readFileSync(join(FIXTURES, "../../app/assets/demo-readings/variants/ph1_oct7_misread.json"), "utf8")) as { reading?: Reading } & Reading;
      const ph1: Reading = { scene: (ph1file.reading ?? ph1file).scene, garments: (ph1file.reading ?? ph1file).garments };
      const outfits: [string, Reading][] = [["PLAIN", R("PLAIN")], ["BOXY", R("BOXY")], ["BRIGHTS", R("BRIGHTS")], ["SKINNY", R("SKINNY")]];
      for (const [name, rd] of outfits) {
        for (const occasion of ["everyday", "date"]) {
          const opts = { occasion };
          const got = scoreParts(rd, opts);
          const want = V15.scoreParts(rd, opts);
          expect([name, occasion, got]).toEqual([name, occasion, want]);
          expect([name, (got as PartsScored).v16]).toEqual([name, undefined]);
          expect([name, partsOverall(rd, opts)]).toEqual([name, want.overall]);
          expect([name, suggestPartsFixes(rd, opts)]).toEqual([name, suggestPartsFixes(rd, opts, { parts: V15 })]);
        }
      }
      // the numbers v15 gives (v16: PLAIN 7.0, BOXY 8.5, BRIGHTS 4.5, SKINNY 5.5)
      expect(outfits.map(([, rd]) => (scoreParts(rd, { occasion: "everyday" }) as PartsResult).overall)).toEqual([7.0, 8.0, 6.5, 6.5]);
      // the one quick tap: ph1 (black wide jeans read as sweatpants) at Date; every option scored by v15 (jeans 6.5; v16 gives 6.0)
      const q = askQuestionParts(ph1, { occasion: "date" });
      expect(q).not.toBeNull();
      for (const o of q!.options) {
        expect([o.value, o.score]).toEqual([o.value, V15.scoreParts(applyTapAnswer(ph1, { garmentIndex: q!.garmentIndex, field: "subcategory" }, o.value), { occasion: "date" }).overall]);
      }
      expect(q!.options.find((o) => o.value === "jeans")?.score).toBe(6.5);
      // allowedColors follows the switch
      const others = R("BRIGHTS").garments.filter((g) => g.category !== "bottom");
      const piece = R("BRIGHTS").garments.find((g) => g.category === "bottom") as Garment;
      expect(allowedColors({ others, piece })).toEqual(allowedColors({ others, piece }, { parts: V15 }));
    });
  });
});
