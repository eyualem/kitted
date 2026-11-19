#!/usr/bin/env python3
"""His noted outfits from the Nov 17 card-by-card review (T68), scored four ways ($0): today (v15), the Nov 16 build,
his Nov 17 asks (the engine now) and the steady alternative. Reported, never tuned to alone."""
import json
import sys
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE / "rubrics"))
import v16_paper as V  # noqa: E402
import hoodie_layer_paper as H  # noqa: E402
import parts_proto as P  # noqa: E402

NOTED = [("C033", "white tee, wide jorts, Timbs", "8"), ("C142", "tee, black wide jorts, Jordans", "8+"),
         ("ig-063", "black graphic tee, oversized olive cargo shorts, brown boots", "9"),
         ("ig-030", "light-blue oxford, khaki wide shorts, loafers", "8+"),
         ("ig-071", "light-blue oxford, wide black trousers, black shoes", "8+"),
         ("C146", "tan chore coat, black straight chinos, derbies", "above 8"),
         ("ig-059", "black suit, white shirt, black shoes", "9"),
         ("C094", "navy overshirt, light-blue tee, charcoal chinos", "6.5"),
         ("C059", "blazer over very skinny jeans", "well below 7"),
         ("pin-038", "white tee, blue athletic shorts, grey runners", "no runner charge"),
         ("C114", "orange tee (the matching-socks case; socks aren't read)", "–"),
         ("ig-065", "purple graphic tee, brown wide shorts, slides (summer)", "fine in summer")]
NOV16 = dict(lift_off=[], h7_tip=True, long_top=0.5, long_top_read="reading", shorts=0, one_lift=0.5, leg_skinny=0,
             leg_slim=0, leg_wide=0.5, hem_plus=0.25 * 2, shorts_wide=0.5, shorts_above=0.25, color=0.5, accent_by_look=True)
STEADY = dict(P.TUNE["v16"]["taste"], sil=0, sil_line=0, sil_tonal=0, accent_by_look=True, one_lift=1.0, one_lift_mode=None)


def main():
    runs, panel, founder, _ = H.load_gold()
    f4, rows = V.load_founder4()
    pool = V.rated_pool(runs, founder, f4, rows)
    key = json.loads((HERE / "results/taste1/consistent_key.json").read_text())["key"]
    out = ["| Outfit | His blind (re-rate) | His target | Today v15 | Nov 16 build | Nov 17, his asks | Steady option | Why (his asks) |",
           "|---|---|---|---|---|---|---|---|"]
    for k, name, target in NOTED:
        h, g, rd, lk = pool[k]
        sea = V.season_for(rd)
        old = V.sc(rd, "everyday", V.PROFILE, engine="v15")["overall"]
        n16 = V.sc(rd, "everyday", V.PROFILE, lk, tune={"taste": NOV16, "curve": (1.1, 0.85, 7.0)})["overall"]
        now = V.sc(rd, "everyday", V.PROFILE, lk, season=sea)
        st_ = V.sc(rd, "everyday", V.PROFILE, lk, season=sea, tune={"taste": STEADY})["overall"]
        rr = key.get(k)
        his = f"{h:g}" + (f" ({rr:g})" if rr is not None and rr != h else "")
        out.append(f"| {name} ({k}{', warm' if sea else ''}) | {his} | {target} | {old:g} | {n16:g} | **{now['overall']:g}** | {st_:g} | {V.why(now)} |")
    txt = "\n".join(out) + "\n"
    (HERE / "results/taste1/noted_outfits.md").write_text(txt)
    print(txt)


if __name__ == "__main__":
    sys.exit(main())
