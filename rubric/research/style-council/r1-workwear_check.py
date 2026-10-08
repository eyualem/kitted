import sys, json, copy, collections
sys.path.insert(0, '/Users/eyu/Desktop/files/Kitted/rubric/research/style-council')
sys.path.insert(0, '/Users/eyu/Desktop/files/Kitted/extraction-test')
import rubric
import importlib.util as _u
_sp=_u.spec_from_file_location('wwd','/Users/eyu/Desktop/files/Kitted/rubric/research/style-council/r1-workwear_detect.py'); _m=_u.module_from_spec(_sp); _sp.loader.exec_module(_m); detect_workwear=_m.detect_workwear
FT=dict(rubric.FORMALITY)
def set_fixes(boot=False, darkjeans=False):
    rubric.FORMALITY.clear(); rubric.FORMALITY.update(FT)
    if boot: rubric.FORMALITY["work_boot"]=2.5
    def f(g):
        x=rubric.FORMALITY.get(g.get("subcategory"),2)
        if g.get("subcategory")=="jeans" and not g.get("distressed_by_design") and (g.get("color_family")=="denim_dark" or (darkjeans and g.get("color_family")=="black")): x=2.5
        return x
    rubric.formality=f
def load():
    out=collections.defaultdict(list)
    for f in ['results/test3-stock-40-v3/raw_results.json','results/test4-mirror-12-v3/raw_results.json']:
        for r in json.load(open('/Users/eyu/Desktop/files/Kitted/extraction-test/'+f)):
            e=r['extraction']; e=json.loads(e) if isinstance(e,str) else e
            if e: out[(r['outfit'],r['stage'])].append(e)
    return out
STY={'minimalist':.5,'smart_casual':.5}
data=load()
print("== detection")
for k,runs in data.items():
    res=[detect_workwear(e) for e in runs]
    if any(x[0] for x in res) or k[0] in ('s10','s20','p02','m02','m10','s26'): print(k,[(x[0],x[1]) for x in res],res[0][2])
for p in json.load(open('/Users/eyu/Desktop/files/Kitted/rubric/research/style-council/phone-checks-oct7.json')):
    print(p['check'][:11],p['app_score'],detect_workwear(p['reading']))
print("== fixes")
for occ in ['everyday','date','work','interview_tech']:
    for name,kw in [("boot",{"boot":True}),("darkjeans_black",{"darkjeans":True})]:
        ch=[]
        for k,runs in data.items():
            set_fixes(); b=[rubric.score(copy.deepcopy(e),occ,STY)['overall'] for e in runs]
            set_fixes(**kw); a=[rubric.score(copy.deepcopy(e),occ,STY)['overall'] for e in runs]
            if a!=b: ch.append((k[0],b,a))
        print(occ,name,ch)
set_fixes()
def G(cat, sub, color, **kw):
    g=dict(category=cat, subcategory=sub, color_family=color, pattern="solid", logo="none", volume=3, leg_shape="na", hem="na",
           tucked="na", condition="clean", certainty="clear", length="na", pattern_scale="na", saturation="na", sleeve_end="na",
           strain="none", distressed_by_design=False, shows_below_outer=False); g.update(kw); return g
def E(*gs): return {"scene":{"framing":"full_body","shoes_visible":True,"people_count":1,"mirror_selfie":True,"lighting":"good","clothed":"fully"},"garments":list(gs)}
A={
 "4":E(G("outerwear","chore_coat","tan_camel",condition="stained"),G("top","flannel_shirt","red",pattern="checks_plaid",pattern_scale="medium",saturation="bright",tucked="none",length="below_crotch",condition="wrinkled"),G("bottom","cargos","olive",leg_shape="relaxed",hem="pooling"),G("footwear","canvas_sneaker","white",condition="pilled_or_worn")),
 "5.5":E(G("top","flannel_shirt","red",pattern="checks_plaid",pattern_scale="medium",saturation="bright",tucked="none",length="below_crotch",condition="wrinkled"),G("bottom","cargos","olive",leg_shape="relaxed",hem="pooling"),G("footwear","work_boot","brown")),
 "6.5":E(G("top","flannel_shirt","red",pattern="checks_plaid",pattern_scale="medium",tucked="none",length="mid_fly",condition="wrinkled"),G("bottom","jeans","denim_mid",leg_shape="relaxed",hem="pooling"),G("footwear","work_boot","brown")),
 "7.5":E(G("top","tee","white",tucked="none",length="at_belt"),G("bottom","jeans","denim_mid",leg_shape="straight",hem="cuffed"),G("footwear","work_boot","brown")),
 "8.5":E(G("outerwear","chore_coat","olive",volume=4),G("top","tee","white",tucked="none",length="at_belt"),G("bottom","jeans","black",leg_shape="straight",hem="cuffed"),G("footwear","canvas_sneaker","off_white_cream")),
 "9.5":E(G("outerwear","chore_coat","tan_camel",volume=4),G("top","flannel_shirt","olive",pattern="checks_plaid",pattern_scale="medium",tucked="none",length="at_belt"),G("bottom","jeans","black",leg_shape="straight",hem="cuffed"),G("footwear","work_boot","brown")),
 "textbook_boots":E(G("outerwear","chore_coat","olive",volume=4),G("top","tee","white",tucked="none",length="at_belt"),G("bottom","jeans","black",leg_shape="straight",hem="cuffed"),G("footwear","work_boot","brown")),
 "sc_twin":E(G("outerwear","overshirt","khaki_beige"),G("top","tee","white",tucked="none",length="at_belt"),G("bottom","chinos","navy",leg_shape="straight",hem="slight_break"),G("footwear","white_leather_sneaker","white")),
 "skinny_check":E(G("outerwear","chore_coat","brown",volume=4),G("top","tee","white",tucked="none",length="mid_fly"),G("bottom","jeans","black",leg_shape="skinny",hem="full_break",distressed_by_design=True,volume=1),G("footwear","chunky_sneaker","white")),
 "dd_same":E(G("outerwear","denim_jacket","denim_light"),G("top","tee","white",tucked="none",length="at_belt"),G("bottom","jeans","denim_light",leg_shape="straight",hem="slight_break"),G("footwear","work_boot","brown")),
 "dd_near":E(G("outerwear","denim_jacket","denim_mid"),G("top","tee","white",tucked="none",length="at_belt"),G("bottom","jeans","denim_light",leg_shape="straight",hem="slight_break"),G("footwear","work_boot","brown")),
}
print("== anchors (everyday, no style)")
for n,e in A.items():
    set_fixes(); now=rubric.score(copy.deepcopy(e),"everyday",{})
    set_fixes(boot=True,darkjeans=True); e2=copy.deepcopy(e)
    pr=rubric.score(copy.deepcopy(e2),"everyday",{})
    # fix D: stained pieces earn no credit -> recompute credits without stained garments
    stained=[g for g in e['garments'] if g['condition']=='stained']
    if stained:
        no=copy.deepcopy(e2); no['garments']=[g for g in no['garments'] if g['condition']!='stained']
        cr=rubric.score(no,"everyday",{})['credit_points']
        raw=pr['raw_score']-pr['credit_points']+cr; pr_d=(rubric.round_half(raw), round(raw,2))
    else: pr_d=(pr['overall'],pr['raw_score'])
    print(n, detect_workwear(e)[0], "now",now['overall'],now['raw_score'], "proposed",pr_d)
