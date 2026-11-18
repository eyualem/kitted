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

const H15P = "a8b3c28cd3981000874d85db4c1749505f587ae671eff9de1b64db1a2c2358b9"; // 12,021 cases at a2480b09
const H15F = "e427e6b26b34fa264d70c742837b0be106d029b416e5718ccab9b8acf8754251"; // 30,412 cases
const H15C = "60dac8e76a6aa7a02b903becbc9f9ec60bfb55918c6bb3b52e1e8ce165313dbe"; // 501 cases
const N15P = 12021, N15F = 30412, N15C = 501;
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
    const v15p = P.cases.filter((c) => !c.tune).map((c) => ({ ...stripDefaults(c, [["season"], ["graded_look"]]), expected: expand(c.expected),
      reading_value: P.readings[c.reading] ?? RP[c.reading] }));
    expect(v15p.length).toBe(N15P);
    expect(sha256(canon(v15p))).toBe(H15P);

    const F = loadJSON<{ pool: unknown[]; readings: Record<string, Reading>;
      cases: (Record<string, unknown> & { reading: string; tune?: string; engine?: string; expected: { fixes: number[]; smaller_step: number | null } })[] }>("parts_fixes.json");
    const v15f = F.cases.filter((c) => !c.tune && (c.engine ?? "v15") === "v15").map((c) => ({
      ...stripDefaults(c, [["season"], ["engine", "v15"], ["graded_look"]]),
      expected: { ...c.expected, fixes: c.expected.fixes.map((i) => F.pool[i]), smaller_step: c.expected.smaller_step === null ? null : F.pool[c.expected.smaller_step] },
      reading_value: F.readings[c.reading] ?? RP[c.reading],
    }));
    expect(v15f.length).toBe(N15F);
    expect(sha256(canon(v15f))).toBe(H15F);
    // the v16 fix cases are there too (after the v15 ones), so the slice above isn't the whole file by accident
    expect(F.cases.length).toBeGreaterThan(N15F);

    const C = loadJSON<{ cases: (Record<string, unknown> & { engine?: string })[] }>("rules_conformance.json");
    const v15c = C.cases.filter((c) => (c.engine ?? "v15") === "v15").map((c) => stripDefaults(c, [["engine", "v15"], ["season"], ["graded_look"]]));
    expect(v15c.length).toBe(N15C);
    expect(sha256(canon(v15c))).toBe(H15C);
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
    afterEach(() => setRescoreV16(RESCORE_V16));

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
