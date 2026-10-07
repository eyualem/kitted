"""Writes the demo readings (fixtures/readings/*.json) and their sidecar index (readings/INDEX.json).

Run:  /usr/bin/python3 /Users/eyu/Desktop/files/Kitted/handoff/fixtures/make_readings.py

- Real readings come from the LOCKED config (lockin-oct6/B-stock = gemini-3.8-flash, thinking off,
  v3 answer format, 1024 px). For each photo we pick the MODAL run: the most common score among the
  3 runs (scored as the run itself was scored: everyday, minimalist 0.5 / smart casual 0.5), then the
  run whose garment fields agree most with the other runs, then the lowest run index.
- p01b / p01a are HAND-AUTHORED (the "intended" readings the mockups show). The real model reading of
  p01 differs (it counts the held overshirt as worn and marks the shoes hidden); those real readings
  are saved as variants/p01b_real.json and variants/p01a_real.json for reference.
- Variants (corrections, what-ifs, snaps) are hand-derived from the base readings and live in variants/.
Only reads extraction-test/; writes only inside handoff/fixtures/.
"""
import sys as _sys; _sys.dont_write_bytecode = True  # never write __pycache__ next to rubric.py
import copy, csv, hashlib, json, os, sys
from collections import Counter

KEMPT = "/Users/eyu/Desktop/files/Kitted"
FIX = os.path.join(KEMPT, "handoff/fixtures")
OUT = os.path.join(FIX, "readings")
sys.path.insert(0, os.path.join(KEMPT, "extraction-test"))
import rubric  # noqa: E402

LOCKED = os.path.join(KEMPT, "extraction-test/results/lockin-oct6/B-stock/raw_results.json")
TEST_STYLES = {"minimalist": 0.5, "smart_casual": 0.5}

# demo photo id -> (outfit folder, stage, file in inputs/, what the mockups use it for)
PHOTOS = {
    "p01b": ("p01", "before", "before_studio.jpg", "Screens 5-9: camera, reading, result 8.0, Why 8.0, Not quite right?"),
    "p01a": ("p01", "after", "after_studio.jpg", "Screens 10, 16, 18, 20: re-check 9.0, Lookbook row, paywall, share card"),
    "s15": ("s15", "before", "before_street.jpg", "Screen 1: welcome hero card 8.5 Sharp, Everyday, Full check"),
    "s24": ("s24", "before", "before_mirror.jpg", "Screens 11, 16: partial check 6.5 Getting there, Lookbook row Tue Oct 20"),
    "s12": ("s12", "before", "before_street.jpg", "Screen 19: limit card photo (held for tomorrow, scored after 4 am)"),
    "s25": ("s25", "before", "before_mirror.jpg", "Screen 5: camera library thumbnail"),
    "s05": ("s05", "before", "before_studio.jpg", "Screen 2: onboarding look tile (style: minimalist)"),
    "s22": ("s22", "before", "before_phone.jpg", "Screens 2-3: onboarding look tile, SELECTED (style: smart_casual)"),
    "s14": ("s14", "before", "before_street.jpg", "Screen 2: onboarding look tile (style: gorpcore)"),
    "s10": ("s10", "before", "before_street.jpg", "Screens 2-3: onboarding look tile, SELECTED (style: workwear)"),
    "s13": ("s13", "before", "before_street.jpg", "Screen 2: onboarding look tile (style: streetwear)"),
    "s09": ("s09", "before", "before_street.jpg", "Screen 2: onboarding look tile (style: old_money)"),
}


def G(category, subcategory, color, **kw):
    """A full v3 garment with every schema field (schema.json requires all 18)."""
    g = {"category": category, "subcategory": subcategory, "color_family": color, "pattern": "solid", "logo": "none",
         "volume": 3, "leg_shape": "na", "hem": "na", "tucked": "na", "condition": "clean", "certainty": "clear",
         "length": "na", "pattern_scale": "na", "saturation": "na", "sleeve_end": "na", "strain": "none",
         "distressed_by_design": False, "shows_below_outer": False}
    g.update(kw)
    return g


SCENE_FULL = {"framing": "full_body", "shoes_visible": True, "people_count": 1, "mirror_selfie": False,
              "lighting": "good", "clothed": "fully"}

TEE = G("top", "tee", "white", tucked="none", length="at_belt")
CHINOS = G("bottom", "chinos", "tan_camel", leg_shape="straight", hem="slight_break")
SNEAKERS = G("footwear", "white_leather_sneaker", "white")
OVERSHIRT = G("outerwear", "overshirt", "khaki_beige", tucked="none", length="mid_fly", sleeve_end="at_wrist")

HAND = {
    # Before: overshirt held in the hand, not worn. It sits in `held_items`, a demo-only top-level key that
    # rubric.py ignores (it reads only scene + garments). Proposed for schema v4.x as `worn: false`.
    "p01b": {"scene": dict(SCENE_FULL), "garments": [TEE, CHINOS, SNEAKERS], "held_items": [OVERSHIRT]},
    # After: the same outfit with the overshirt worn open.
    "p01a": {"scene": dict(SCENE_FULL), "garments": [TEE, OVERSHIRT, CHINOS, SNEAKERS]},
}


def agreement(run, runs):
    """How many key fields of this run equal the per-field mode across all runs (garments aligned by category order)."""
    def slots(ext):
        out, seen = {}, Counter()
        for g in ext["garments"]:
            k = f'{g["category"]}{seen[g["category"]]}'; seen[g["category"]] += 1
            out[k] = g
        return out
    keys = ("subcategory", "color_family", "volume", "leg_shape", "hem", "pattern", "certainty", "saturation")
    all_slots = [slots(r["extraction"]) for r in runs]
    mine = slots(run["extraction"])
    agree = total = 0
    for k, g in mine.items():
        for f in keys:
            # a slot the other runs don't have counts as disagreement for them
            vals = [s[k].get(f) if k in s else None for s in all_slots]
            mode = Counter(vals).most_common(1)[0][0]
            agree += g.get(f) == mode; total += 1
    layout = sum(1 for s in all_slots if set(s) == set(mine)) / len(all_slots)  # same garment layout
    return agree / total + layout


def pick_modal(runs):
    scores = [rubric.score(copy.deepcopy(r["extraction"]), "everyday", TEST_STYLES)["overall"] for r in runs]
    cnt = Counter(scores)
    top = max(cnt.values())
    modal = sorted(s for s, n in cnt.items() if n == top)
    modal_score = modal[len(modal) // 2]
    cands = [r for r, s in zip(runs, scores) if s == modal_score]
    cands.sort(key=lambda r: (-agreement(r, runs), r["run"]))
    return cands[0], scores, modal_score


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        h.update(f.read())
    return h.hexdigest()


def write(path, obj):
    with open(path, "w") as f:
        json.dump(obj, f, indent=1)
        f.write("\n")


def main():
    locked = json.load(open(LOCKED))
    meta = {}
    with open(os.path.join(KEMPT, "inputs/fitcheck-photos/metadata.csv")) as f:
        for row in csv.DictReader(f):
            meta[(row["folder"], row["file"])] = row
    index = {"generated_by": "handoff/fixtures/make_readings.py", "locked_source": LOCKED,
             "locked_config": {"model": "gemini-3.8-flash", "thinking": "off", "format": "v3", "image_px": 1024,
                               "prompt_sha": "392fcb9a0679", "schema_sha": "4e7307888d97", "rubric_sha": "807f18c29da1"},
             "modal_rule": "most common overall (everyday, minimalist 0.5 / smart_casual 0.5) -> most field agreement -> lowest run",
             "photos": [], "variants": []}

    for pid, (outfit, stage, fname, use) in PHOTOS.items():
        runs = [r for r in locked if r["outfit"] == outfit and r["stage"] == stage and r.get("extraction")]
        best, run_scores, modal = pick_modal(runs)
        img = os.path.join(KEMPT, "mockups/img", pid + ".jpg")
        m = meta[(outfit, fname)]
        entry = {"id": pid, "reading_file": f"readings/{pid}.json", "photo_file": f"mockups/img/{pid}.jpg",
                 "photo_sha256": sha256(img), "original_file": f"inputs/fitcheck-photos/{outfit}/{fname}",
                 "license": m["license"], "source_url": m["page_url"], "photographer": m["photographer"],
                 "description": m["short_outfit_description"], "used_for": use,
                 "latency_s": best.get("seconds_api") or best.get("seconds")}
        if pid in HAND:
            reading = HAND[pid]
            entry.update({"provenance": "hand-authored",
                          "why": "intended reading for the mockup story; the real p01 reading counts the held overshirt "
                                 "as worn and marks shoes hidden (see variants/p01b_real.json, p01a_real.json)",
                          "real_run_for_reference": f"lockin-oct6/B-stock {outfit}/{fname} run {best['run']}",
                          "real_run_scores_test_config": run_scores})
            real = {"scene": best["extraction"]["scene"], "garments": best["extraction"]["garments"]}
            write(os.path.join(OUT, "variants", f"{pid}_real.json"), real)
            index["variants"].append({"id": f"{pid}_real", "file": f"readings/variants/{pid}_real.json", "base": pid,
                                      "provenance": f"real: lockin-oct6/B-stock {outfit}/{fname} run {best['run']} (modal)",
                                      "what": "the real model reading of this photo, kept to document the extraction issue"})
            entry["latency_s"] = best.get("seconds_api")
        else:
            reading = {"scene": best["extraction"]["scene"], "garments": best["extraction"]["garments"]}
            entry.update({"provenance": "real", "run_id": f"lockin-oct6/B-stock {outfit}/{fname} run {best['run']}",
                          "run_scores_test_config": run_scores, "modal_score_test_config": modal})
        write(os.path.join(OUT, pid + ".json"), reading)
        index["photos"].append(entry)

    # ---------- variants (hand-derived) ----------
    def load(pid):
        return json.load(open(os.path.join(OUT, pid + ".json")))
    variants = []

    v = load("p01b")
    v["garments"][1]["leg_shape"] = "slim"
    variants.append(("p01b_chinos_slim", v, "p01b", "Not quite right? correction: chinos straight -> slim (screen 9: 'Score stays 8.0')"))

    s24 = load("s24")
    bi = next(i for i, g in enumerate(s24["garments"]) if g["category"] == "bottom")

    v = copy.deepcopy(s24)
    v["garments"][bi].update({"subcategory": "jeans", "color_family": "denim_dark", "leg_shape": "slim", "hem": "na",
                              "pattern": "solid", "saturation": "na"})
    variants.append(("s24_jeans", v, "s24", "what-if: bottom swapped to his closet's Dark jeans (denim_dark, slim). Fix 'Swap to jeans or chino shorts'"))

    v = copy.deepcopy(s24)
    v["garments"][bi].update({"subcategory": "jeans"})
    variants.append(("s24_jeans_generic", v, "s24", "what-if: generic fix edit, bottom.subcategory = jeans (other fields kept). The fix engine's gain for O4"))

    v = copy.deepcopy(s24)
    v["garments"][bi].update({"subcategory": "shorts"})
    variants.append(("s24_chino_shorts_generic", v, "s24", "what-if: generic fix edit, bottom.subcategory = shorts (chino shorts)"))

    v = copy.deepcopy(s24)
    v["scene"]["shoes_visible"] = True
    v["garments"].append(G("footwear", "white_leather_sneaker", "white"))
    variants.append(("s24_closet_shoes", v, "s24", "Pick from Closet: his White sneakers added as footwear, scene.shoes_visible = true, hem unknown ('na')"))

    v = copy.deepcopy(s24)
    v["scene"]["shoes_visible"] = True
    v["garments"].append(G("footwear", "retro_runner", "grey", certainty="clear"))
    variants.append(("s24_shoe_snap_runners", v, "s24", "Shoe snap result: grey retro runners read from a feet photo, merged as the footwear slot"))

    for vid, reading, base, what in variants:
        write(os.path.join(OUT, "variants", vid + ".json"), reading)
        index["variants"].append({"id": vid, "file": f"readings/variants/{vid}.json", "base": base,
                                  "provenance": "hand-derived from " + base, "what": what})

    write(os.path.join(OUT, "INDEX.json"), index)
    print(f"wrote {len(index['photos'])} photo readings + {len(index['variants'])} variants to {OUT}")
    for e in index["photos"]:
        print(f"  {e['id']:5} {e['provenance']:13} {e.get('run_id') or e.get('real_run_for_reference')}  "
              f"test-config scores {e.get('run_scores_test_config') or e.get('real_run_scores_test_config')}")


if __name__ == "__main__":
    main()
