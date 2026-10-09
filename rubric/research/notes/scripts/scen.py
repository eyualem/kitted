# Helpers to write readings by hand (DECISIONS-LOG #160, #163).
import sys; sys.dont_write_bytecode=True
sys.path.insert(0,"/Users/eyu/Desktop/files/Kitted/handoff/fixtures")
import kitted_logic as kl
D=dict(pattern="solid",logo="none",volume=3,leg_shape="na",hem="na",tucked="none",condition="clean",certainty="clear",length="mid_fly",pattern_scale="na",saturation="na",sleeve_end="at_wrist",strain="none",distressed_by_design=False,shows_below_outer=False)
def g(cat,sub,col,**kw): x=dict(D);x.update(category=cat,subcategory=sub,color_family=col);x.update(kw);return x
def R(*gs): return {"scene":{"framing":"full_body","shoes_visible":True,"people_count":1,"mirror_selfie":True,"lighting":"good","clothed":"fully"},"garments":list(gs)}
def show(name,r,occ="everyday"):
    s=kl.score(r,occ); f=kl.suggest_fixes(r,occasion=occ)
    print(f"{name:58s} {s['overall']:>4} raw {s['raw_unrounded']:.2f} credits {s['credits']} fired {s['rules_fired']}")
    for x in f["fixes"]: print(f"      fix: {x['copy']} -> {x['to']}  (raw {x.get('to_raw')})")
    for x in f["next_level"]: print("      next:",x)
jeans=lambda c="black",leg="straight":g("bottom","jeans",c,leg_shape=leg,hem="slight_break",length="na",tucked="na",sleeve_end="na")
shoe=lambda s,c="white":g("footwear",s,c,length="na",tucked="na",sleeve_end="na")
if __name__ == "__main__":  # the #160 audit outfits
    print("--- summer")
    show("white tee + chino shorts + white leather sneakers", R(g("top","tee","white"),g("bottom","shorts","khaki_beige",leg_shape="straight",hem="na",length="na",tucked="na",sleeve_end="na"),shoe("white_leather_sneaker")))
    show("white tee + dark jeans + canvas sneakers", R(g("top","tee","white"),jeans("denim_dark"),shoe("canvas_sneaker")))
    print("--- sweatshirt vs knit, same outfit")
    show("green crewneck SWEATSHIRT + black wide jeans + white leather", R(g("top","sweatshirt","green",saturation="muted"),jeans("black","wide"),shoe("white_leather_sneaker")))
    show("green knit SWEATER + black wide jeans + white leather", R(g("top","sweater","green",saturation="muted"),jeans("black","wide"),shoe("white_leather_sneaker")))
    print("--- streetwear done right")
    show("grey hoodie + black wide jeans + chunky sneakers", R(g("top","hoodie","grey"),jeans("black","wide"),shoe("chunky_sneaker")))
    show("grey hoodie + black wide jeans + work boots", R(g("top","hoodie","grey"),jeans("black","wide"),shoe("work_boot","olive")))
    show("black logo hoodie + black wide jeans + slides (class)", R(g("top","hoodie","black",logo="large",pattern="graphic",pattern_scale="large"),jeans("black","wide"),shoe("slides_sandals","black")),"class")
    print("--- smart casual done right")
    show("oxford + chinos + loafers", R(g("top","oxford_shirt","light_blue"),g("bottom","chinos","khaki_beige",leg_shape="straight",hem="slight_break",length="na",tucked="na",sleeve_end="na"),shoe("loafer","brown")))
    show("navy overshirt + white tee + chinos + loafers", R(g("outerwear","overshirt","navy"),g("top","tee","white"),g("bottom","chinos","khaki_beige",leg_shape="straight",hem="slight_break",length="na",tucked="na",sleeve_end="na"),shoe("loafer","brown")))
    print("--- layer over a hoodie")
    show("navy overshirt over grey hoodie + black jeans + chunky", R(g("outerwear","overshirt","navy"),g("top","hoodie","grey"),jeans("black","wide"),shoe("chunky_sneaker")))
