"""Niche styles on paper (Nov 18, 2026; rubric/research/niche-styles.md). $0: made-up readings through v16.
Needs the v16 engine (branch claude/rescoring-v16-58d34b) and handoff/fixtures on sys.path; set V16 below.
"""
import os
V16=os.environ.get("V16","/path/to/checkout-with-v16")
import sys
sys.dont_write_bytecode=True
sys.path.insert(0,''+V16+'/extraction-test')
sys.path.insert(0,''+V16+'/extraction-test/rubrics')
import rules_conformance as RC
import parts_proto as P
from rules_conformance import *
def run(rd, occ="everyday", season=None):
    r=P.score_parts(rd,occ,{},None,"a_little",engine="v16",season=season)
    return r
if __name__=="__main__":
    rd=Rd(TEE,DJEANS,WLS)
    r=run(rd)
    print(r.keys() if isinstance(r,dict) else r)
    import json
    print(json.dumps({k:r[k] for k in r if k in('final','shown','parts','styles','label','detected','score')},default=str)[:1500])

def show(name, rd, occ="everyday", season=None, want=None):
    r=run(rd,occ,season)
    ps=r['parts']
    out=[f"{name}: {r['overall']}  look={r['style_label']} det={r['detected_styles']}"]
    out.append("  parts "+" ".join(f"{k[:4]}={v['display']}" for k,v in ps.items() if v.get('display') is not None))
    for k,v in ps.items():
        for x in v.get('reasons',[]):
            if x.get('points',0)<0: out.append(f"    -{abs(x['points'])} {k[:4]} {x['check']}: {x['line']}")
    c=r.get('condition',{}) ; o=r.get('occasion',{})
    v=r.get('v16',{})
    out.append("  v16: "+str({k:v[k] for k in v if k not in('unread','depends')})[:420])
    if want: out.append(f"  SHOULD BE ~ {want}")
    print("\n".join(out))
    return r

# ---- the outfits
def line(n,rd,occ="everyday",season=None):
    r=run(rd,occ,season); ps=r['parts']
    neg=[]
    for k,v in ps.items():
        for x in v.get('reasons',[]):
            if x.get('points',0)<0: neg.append(f"{k[:3]}-{abs(x['points'])} {x['check']}")
    v=r['v16']
    print(f"{n:6} {r['overall']:4} look={r['style_label']} det={','.join(r['detected_styles'])} | "+" ".join(f"{k[:3]}={v2['display']}" for k,v2 in ps.items() if v2.get('display') is not None)+" | "+("; ".join(neg) or "-")+f" | held={v.get('held_by')} caps={[c if isinstance(c,str) else c.get('id') for c in v.get('caps',[])]} lifts={[l['id'] for l in v.get('lifts',[])]}")
T=lambda s,c,**k: top(s,c,**k)
# ---- old money
line("OM1",Rd(top("knit_polo","navy",tucked="full",length="mid_fly"),bottom("trousers","off_white_cream","straight","no_break"),shoe("loafer","brown")))
line("OM1b",Rd(top("knit_polo","navy",tucked="full"),bottom("trousers","off_white_cream","wide","no_break"),shoe("loafer","brown")))
line("OM2",Rd(top("sweater","off_white_cream",vol=3,tucked="none",length="mid_fly"),bottom("trousers","grey","straight","slight_break"),shoe("loafer","brown")))
line("OM3",Rd(outer("blazer","navy",length="mid_fly"),top("oxford_shirt","white",tucked="full"),bottom("chinos","khaki_beige","slim","no_break"),shoe("loafer","brown")))
line("OM4",Rd(top("cardigan","navy"),top("oxford_shirt","white",tucked="full"),bottom("chinos","khaki_beige","slim","no_break"),shoe("loafer","brown")))
line("OM5",Rd(outer("overcoat","tan_camel",length="below_crotch"),top("sweater","navy"),bottom("trousers","charcoal","straight","slight_break"),shoe("loafer","black")),season="cool")
line("OM6",Rd(top("polo","white",tucked="full"),bottom("shorts","khaki_beige","relaxed","shorts"),shoe("loafer","brown")),season="warm")
line("OM7",Rd(top("quarter_zip","grey"),top("oxford_shirt","light_blue",tucked="full"),bottom("trousers","navy","slim","no_break"),shoe("loafer","brown")))
# ---- sportswear
line("SP1",Rd(top("tee","white",vol=3),bottom("joggers","black","relaxed","cuffed"),shoe("retro_runner","grey")))
line("SP2",Rd(top("sweatshirt","grey",vol=3),bottom("sweatpants","grey","relaxed","cuffed"),shoe("white_leather_sneaker","white")))
line("SP3",Rd(top("quarter_zip","navy"),bottom("joggers","black","straight","no_break"),shoe("low_profile_sneaker","white")))
line("SP4",Rd(top("tee","white",vol=3),bottom("athletic_shorts","black","relaxed","shorts"),shoe("performance_runner","grey")),season="warm")
line("SP5",Rd(top("hoodie","black",vol=4),bottom("joggers","black","straight","full_break"),shoe("performance_runner","white")))
line("SP6",Rd(top("jersey","navy",vol=4),bottom("sweatpants","grey","wide","slight_break"),shoe("low_profile_sneaker","white")))
# ---- gorp / tech
line("GP1",Rd(outer("shell_jacket","orange"),top("tee","grey"),bottom("cargos","olive","relaxed","slight_break"),shoe("trail_shoe","grey")))
line("GP2",Rd(outer("fleece","tan_camel",vol=4),top("tee","white"),bottom("cargos","black","straight","no_break"),shoe("trail_shoe","black")))
line("TW1",Rd(outer("shell_jacket","black",vol=4,length="below_crotch"),top("tee","black"),bottom("cargos","black","wide","stacked"),shoe("chunky_sneaker","black")))
line("TW2",Rd(top("hoodie","black",vol=4,length="below_crotch"),bottom("cargos","black","wide","pooling"),shoe("work_boot","black")))
# ---- skater
line("SK1",Rd(top("graphic_tee","black",vol=5,length="below_crotch"),bottom("jeans","denim_mid","wide","pooling"),shoe("canvas_sneaker","black")))
line("SK2",Rd(top("hoodie","grey",vol=4),bottom("jeans","denim_dark","wide","stacked"),shoe("canvas_sneaker","white")))
line("SK3",Rd(top("flannel_shirt","green",pattern="checks_plaid",vol=4),top("tee","white"),bottom("shorts","khaki_beige","wide","shorts"),shoe("canvas_sneaker","black")),season="warm")
# ---- y2k / grunge
line("Y2K1",Rd(top("graphic_tee","white",vol=3,length="at_belt"),bottom("jeans","denim_light","wide","pooling",pattern="solid"),shoe("chunky_sneaker","white")))
line("GR1",Rd(top("graphic_tee","black",vol=3),outer("flannel_shirt","red",pattern="checks_plaid",vol=4),bottom("jeans","black","skinny","full_break"),shoe("work_boot","black")))
line("GR2",Rd(top("tee","grey",condition="pilled_or_worn"),bottom("jeans","denim_dark","straight","full_break",denim_wear="ripped",distressed_by_design=True),shoe("canvas_sneaker","black")))
# ---- amekaji / city boy / japanese
line("AM1",Rd(outer("chore_coat","khaki_beige"),top("oxford_shirt","light_blue"),bottom("jeans","denim_dark","straight","cuffed"),shoe("work_boot","brown")))
line("AM2",Rd(top("flannel_shirt","red",pattern="checks_plaid",vol=3),top("tee","white"),bottom("jeans","denim_dark","straight","cuffed"),shoe("work_boot","brown")))
line("CB1",Rd(top("sweater","grey",vol=5,length="mid_fly"),bottom("trousers","black","wide","no_break"),shoe("loafer","black")))
line("CB2",Rd(outer("overshirt","olive",vol=5),top("tee","white",vol=4),bottom("trousers","khaki_beige","wide","no_break"),shoe("low_profile_sneaker","white")))
# ---- archive
line("AR1",Rd(top("tee","black",vol=5,length="below_crotch"),bottom("trousers","black","wide","pooling"),shoe("work_boot","black")))
line("AR2",Rd(outer("leather_jacket","black",vol=4,length="below_crotch"),top("tank_top","black",length="below_crotch"),bottom("cargos","black","wide","pooling"),shoe("chelsea_boot","black")))
line("AR3",Rd(outer("overcoat","charcoal",vol=5,length="below_crotch"),top("sweater","black",vol=4),bottom("trousers","black","relaxed","full_break"),shoe("work_boot","black")),season="cool")
# ---- western
line("WE1",Rd(outer("denim_jacket","denim_mid"),top("tee","white"),bottom("jeans","denim_dark","straight","full_break"),shoe("chelsea_boot","brown")))
line("WE2",Rd(top("flannel_shirt","tan_camel",pattern="checks_plaid",tucked="full"),bottom("jeans","denim_dark","straight","full_break"),shoe("chelsea_boot","brown")))

# ---- second batch (variants)
line("SP1b",Rd(top("tee","white"),bottom("joggers","black","relaxed","cuffed"),shoe("white_leather_sneaker","white")))
line("SP1c",Rd(top("tee","white"),bottom("joggers","black","straight","no_break"),shoe("low_profile_sneaker","white")))
line("SP1d",Rd(top("tee","white"),bottom("joggers","black","relaxed","cuffed"),shoe("retro_runner","grey")),"class")
line("SP4b",Rd(top("tee","white"),bottom("athletic_shorts","black","relaxed","shorts"),shoe("retro_runner","grey")),season="warm")
line("SP7",Rd(top("quarter_zip","grey"),bottom("sweatpants","grey","straight","no_break"),shoe("retro_runner","grey")))
line("OM2b",Rd(top("sweater","off_white_cream",tucked="full"),bottom("trousers","grey","wide","no_break"),shoe("loafer","brown")))
line("OM8",Rd(top("cardigan","tan_camel"),top("polo","white"),bottom("trousers","grey","straight","slight_break"),shoe("loafer","brown")))
line("WE3",Rd(outer("denim_jacket","denim_mid"),top("tee","white"),bottom("jeans","denim_dark","straight","full_break"),shoe("other","brown")))
line("GR1b",Rd(top("graphic_tee","black",vol=3),outer("flannel_shirt","red",pattern="checks_plaid",vol=4),bottom("jeans","black","slim","full_break"),shoe("work_boot","black")))
line("GR1c",Rd(top("graphic_tee","black",vol=4),bottom("jeans","black","skinny","full_break"),shoe("canvas_sneaker","black")))
