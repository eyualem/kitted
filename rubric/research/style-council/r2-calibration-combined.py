"""Calibration r2: one patched rubric combining the round-1 proposals likely to survive. Flags toggle each."""
import math, copy, importlib.util, sys
sys.path.insert(0,'/Users/eyu/Desktop/files/Kitted/extraction-test')
import rubric as R
C='/Users/eyu/Desktop/files/Kitted/rubric/research/style-council/'
def _load(name,path):
    spec=importlib.util.spec_from_file_location(name,path); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
ST=_load('st',C+'r1-streetwear-proto.py'); VS=_load('vs',C+'r1-vintage_sport_proto.py'); WW=_load('ww',C+'r1-workwear_detect.py')

ALL = dict(
 detect=True,            # styles detected from garments; picks waive nothing
 band_union=True,        # detected style can only widen (C4)
 street_allow=True, c6=True, s3_slides=False, k4_street=True, k3_strict=True,
 vintage_ladder=True, ath_o1_as2=True, ath_f4_half=True, joggers_lounge=True,
 prep_allow=True, sc_a1=True, minimal_allow=True, p3_cropped=True,
 work_boot25=True, black_jeans25=True, distressed_narrow=True, stained_nocredit=True,
 k1_tier=True, fleece_k1=True, s1_cinched=True, k3_no_care=True, one_focal_per_garment=True,
 cap=True, o1ramp=True, floor5=True, one_credit=True, k3_nosmall=True, noscale=True, overshirt_layer=True, s2ramp=True, matched_set=True,
)
NONE = {k:False for k in ALL}
KNIT=R.KNIT_TOPS; TECH={'shell_jacket','rain_jacket','puffer','fleece'}
LEATHER_SHOES={'loafer','derby','dress_shoe','chelsea_boot','suede_chukka'}
SC_SHOES=LEATHER_SHOES|{'white_leather_sneaker','low_profile_sneaker'}
NEUT_MIN={'white','off_white_cream','light_grey','grey','charcoal','black','navy','khaki_beige','tan_camel','brown','olive','light_blue','denim_dark','burgundy','sage'}
MIN_HOME={'sweater','cardigan','knit_polo','oxford_shirt','overshirt','overcoat','unstructured_blazer','leather_jacket','trousers','drawstring_trousers','chinos','white_leather_sneaker','low_profile_sneaker','loafer','chelsea_boot','derby'}
PREP_HOME={'oxford_shirt','polo','knit_polo','rugby_shirt','sweater','cardigan','quarter_zip','chinos','shorts','blazer','loafer','white_leather_sneaker','trousers'}
BANDS={'streetwear':((3,5),('straight','wide')),'minimalist':((2,4),('straight','wide')),'classic_prep':((2,3),('slim','relaxed')),
       'workwear':((2,4),('straight','wide')),'vintage_sport':((3,4),('straight','wide')),'outdoor':((3,4),('slim','wide'))}
LO=R.LEG_ORDER

def detect_minimal(gs):
    main=[g for g in gs if g['category'] in ('top','outerwear','bottom','footwear')]
    if len(main)<2: return False
    cl=[g for g in main if g['category']!='footwear']
    if any(g.get('pattern') in ('graphic','camo','floral','checks_plaid') for g in main): return False
    if any(g.get('logo')=='large' for g in main): return False
    if any(R.is_bright(g) for g in main): return False
    if sum(1 for g in main if g['color_family'] not in R.NEUTRALS)>=2: return False
    if any(g['subcategory'] in ('sweatpants','joggers','athletic_shorts','suit_jacket') for g in main): return False
    if any(g.get('distressed_by_design') and g['subcategory'] not in ('jeans','denim_jacket') for g in main): return False
    if not all(g['color_family'] in NEUT_MIN for g in main if g['category']!='footwear' or g['color_family']!='multicolor'): return False
    fams={R.FAMILY.get(g['color_family'],g['color_family']) for g in main}
    if len(fams)>3: return False
    b=next((g for g in main if g['category']=='bottom'),None)
    tonal=len(fams)<=2
    sil=bool(b and ((b.get('leg_shape') in ('relaxed','wide') and b.get('hem') in ('no_break','slight_break','cropped','cuffed')) or (b.get('leg_shape')=='straight' and b['subcategory'] in ('trousers','chinos','drawstring_trousers'))))
    sil=sil or any((g.get('volume') or 3)>=4 and g.get('length') in ('at_belt','cropped') for g in main if g['category'] in ('top','outerwear'))
    home=any(g['subcategory'] in MIN_HOME for g in main)
    against=sum(1 for g in main if g['subcategory'] in ('chunky_sneaker','basketball_sneaker','performance_runner','slides_sandals'))
    against+=sum(1 for g in cl if g.get('logo')=='small')+sum(1 for g in main if g['category']=='footwear' and g['color_family']=='multicolor')+sum(1 for g in cl if g.get('pattern')=='other')
    strength=tonal+sil+home-against
    return (sil or home) and strength>=2

def detect_sc(gs, shoes_visible):
    subs=[g['subcategory'] for g in gs]
    veto={'hoodie','sweatshirt','graphic_tee','jersey','rugby_shirt','flannel_shirt','fleece','puffer','shell_jacket','rain_jacket','sweatpants','joggers','athletic_shorts','cargos','slides_sandals'}
    if any(s in veto for s in subs) or any(g.get('logo')=='large' or g.get('pattern')=='camo' or (g.get('volume') or 3)>=5 for g in gs): return False
    if 'tank_top' in subs and not any(g['category']=='outerwear' for g in gs): return False
    sj=[g for g in gs if g['subcategory']=='suit_jacket']; bt=next((g for g in gs if g['category']=='bottom'),None)
    if sj and bt and bt['subcategory'] in ('suit_trousers','trousers') and bt['color_family']==sj[0]['color_family']: return False
    strongU={'quarter_zip','knit_polo','polo','oxford_shirt','cardigan','unstructured_blazer','sport_coat','blazer','overshirt'}
    medU={'sweater','dress_shirt','camp_collar_shirt','chore_coat','field_jacket','overcoat','leather_jacket'}
    up=max([2 if g['subcategory'] in strongU else 1 if g['subcategory'] in medU else 0 for g in gs if g['category'] in ('top','outerwear')] or [0])
    bot=0
    if bt:
        if bt['subcategory'] in ('chinos','trousers','suit_trousers'): bot=2
        elif bt['subcategory']=='drawstring_trousers' or (bt['subcategory']=='jeans' and bt['color_family'] in ('denim_dark','black','charcoal')): bot=1
    sh=next((g for g in gs if g['category']=='footwear'),None)
    shoe=0
    if sh: shoe=2 if sh['subcategory'] in ('loafer','derby','chelsea_boot','suede_chukka','white_leather_sneaker') else 1 if sh['subcategory'] in ('low_profile_sneaker','dress_shoe') else 0
    slots=sum(x>0 for x in (up,bot,shoe)); tot=up+bot+shoe
    return slots>=2 and (up>0 or bot==2) and tot>=(4 if sh else 3)

def detect_prep(gs):
    subs=[g['subcategory'] for g in gs]
    tailored=any(s in ('blazer','sport_coat','unstructured_blazer') for s in subs)
    veto={'sweatpants','joggers','athletic_shorts','cargos','chunky_sneaker','basketball_sneaker','performance_runner','slides_sandals','work_boot'}
    if any(s in veto for s in subs): return False
    tops=[g for g in gs if g['category']=='top']
    if not tailored and any(t['subcategory'] in ('hoodie','sweatshirt','graphic_tee','tank_top','jersey','fleece') for t in tops): return False
    if any((t.get('volume') or 3)>=4 for t in tops): return False
    b=next((g for g in gs if g['category']=='bottom'),None)
    if b and ((b['subcategory']=='jeans' and b.get('leg_shape') in ('relaxed','wide')) or b.get('distressed_by_design')): return False
    pts=0; strong=0
    for g in gs:
        s=g['subcategory']
        if s in ('oxford_shirt','polo','knit_polo','rugby_shirt','cardigan'): pts+=2; strong+=1
        elif s in ('sweater','quarter_zip'): pts+=1
        elif s in ('blazer','sport_coat','unstructured_blazer'): pts+=1.5; strong+=1
        elif s in ('overcoat','field_jacket'): pts+=0.5
        elif s in ('chinos','trousers','shorts'): pts+=1.5
        elif s in ('loafer','suede_chukka'): pts+=1
        elif g['category']=='footwear': pts+=0.5
    return pts>=3 and strong>=1

def detect_outdoor(gs):
    subs={g['subcategory'] for g in gs}
    if subs & (ST.TAILORED|{'dress_shoe','derby','loafer','sweatpants','athletic_shorts','jersey'}): return False
    anchors={'shell_jacket','rain_jacket','fleece'}; support={'cargos'}
    slot=lambda g:'up' if g['category'] in ('top','outerwear') else g['category']
    slots={slot(g) for g in gs if g['subcategory'] in anchors|support}
    return bool(subs&anchors) and len(slots)>=2

def formality(g,F):
    f=R.FORMALITY.get(g.get('subcategory'),2)
    s=g.get('subcategory')
    if s=='jeans' and not g.get('distressed_by_design'):
        if g.get('color_family')=='denim_dark' or (F['black_jeans25'] and g.get('color_family')=='black'): f=2.5
    if F['work_boot25'] and s=='work_boot': f=2.5
    return f

def score(ext, occasion='everyday', F=ALL, styles=None):
    F={**NONE,**F}
    scene=ext.get('scene',{}) or {}
    if scene.get('clothed')!='fully': return {'overall':None}
    gs=[copy.deepcopy(g) for g in ext.get('garments',[]) if g.get('certainty')!='unsure' and g.get('category')!='accessory']
    not_rated=[]
    if not scene.get('shoes_visible',True): gs=[g for g in gs if g['category']!='footwear']; not_rated.append('shoes')
    if scene.get('framing')=='upper_only': gs=[g for g in gs if g['category'] not in ('bottom','footwear')]; not_rated.append('bottom half')
    gs=[g for g in gs if g['category']!='traditional']
    if not gs: return {'overall':None}
    for g in gs:
        if g.get('leg_shape') in R.LEG_ALIAS: g['leg_shape']=R.LEG_ALIAS[g['leg_shape']]
    styles=styles or {}
    tot_w=sum(styles.values()) or 1; w=lambda s: styles.get(s,0)/tot_w
    tops=[g for g in gs if g['category']=='top']; top=tops[0] if tops else None
    bottom=next((g for g in gs if g['category']=='bottom'),None)
    shoes=next((g for g in gs if g['category']=='footwear'),None)
    outer=[g for g in gs if g['category']=='outerwear']
    # ---- detection ----
    det=set()
    if F['detect']:
        sd=ST.detect_street(top,outer,bottom,shoes)
        if sd['reads']: det.add('streetwear')
        vp,_=VS.detect_vintage_sport(gs)
        if vp: det.add('vintage_sport')
        if WW.detect_workwear({'scene':scene,'garments':gs})[0]: det.add('workwear')
        if detect_minimal(gs): det.add('minimalist')
        if detect_sc(gs, bool(shoes)): det.add('smart_casual')
        if detect_prep(gs): det.add('classic_prep')
        if detect_outdoor(gs): det.add('outdoor')
        street_on = 'streetwear' in det
        street_anchor = sd['anchor']
    else:
        street_on = w('streetwear')>=0.5; street_anchor=True
    vint_on = ('vintage_sport' in det) if F['detect'] else w('vintage_sport')>=0.5
    work_on = 'workwear' in det
    pen={'fit':0.0,'color':0.0,'proportion':0.0}; occ=[0.0]; fired=[]; amts=[]
    def fire(rule,sub,a,garment=None):
        if a<=0: return
        amts.append([rule,sub,a,garment]); fired.append(rule)
    LOUNGE={'athletic_shorts','sweatpants'}|({'joggers'} if F['joggers_lounge'] else set())
    ath = bool(bottom and bottom['subcategory'] in LOUNGE)
    # ---- FIT ----
    if bottom and bottom.get('hem')=='pooling':
        a=1.0
        if F['street_allow'] and street_on and bottom['subcategory'] in ('jeans','cargos','sweatpants','joggers') and bottom.get('leg_shape') in ('relaxed','wide'):
            a=0.0 if (not shoes or shoes['subcategory'] in ST.STACK_HOLDERS) else 0.5
        elif (not F['detect']) and street_on:
            a=0.0 if bottom.get('leg_shape') in ('relaxed','wide') else 0.5
        if F['ath_f4_half'] and ath: a=min(a, 0.0 if vint_on else 0.5)
        fire('F4_pooling','fit',a,'bottom')
    if bottom and bottom.get('hem')=='full_break' and bottom.get('leg_shape') in ('skinny','slim') and bottom.get('certainty')=='clear':
        fire('F4b','fit',0.25,'bottom')
    care=0.0; care_g=set()
    for i,g in enumerate(gs):
        c=g.get('condition')
        if g.get('distressed_by_design'):
            if not F['distressed_narrow'] or c=='pilled_or_worn': continue
        if c=='wrinkled': care+=0.5; care_g.add(i)
        elif c=='stained' and g.get('certainty')=='clear': care+=1.5; care_g.add(i)
        elif c=='pilled_or_worn':
            halfok = (street_on or work_on or vint_on) if F['detect'] else (w('streetwear')+w('workwear')+w('vintage_sport'))>=0.5
            if F['minimal_allow'] and 'minimalist' in det: halfok=False
            care+=0.25 if (g['category']=='footwear' and halfok) else 0.5; care_g.add(i)
    if care: fire('F7_care','fit',min(care,2.0))
    street_top = F['street_allow'] and street_on and top and top['subcategory'] in ('hoodie','tee','graphic_tee','sweatshirt')
    legacy_street = (not F['detect']) and street_on
    if top and top.get('tucked') in (None,'none','na') and top.get('length')=='below_crotch' and (top.get('volume') or 3)<4 and not (street_top or legacy_street):
        fire('F6','fit',1.0,'top')
    if top and (top.get('volume') or 0)>=4 and not (street_top or legacy_street) and (top.get('sleeve_end')=='covers_hand' or top.get('length')=='below_crotch'):
        fire('F8','fit',0.75,'top')
    for g in tops+outer:
        if g.get('sleeve_end')=='covers_hand':
            ck = g['subcategory'] in ('hoodie','sweatshirt') and street_on
            fire('F9','fit',0.25 if ck else 0.5,'top'); break
    if any(g.get('strain')=='clear' for g in gs): fire('F10','fit',0.75)
    # ---- TUCK ----
    if top and top['subcategory']=='dress_shirt' and top.get('tucked') in ('none',None) and (any(o['subcategory'] in R.TAILORED_OUTER for o in outer) or (bottom and bottom['subcategory'] in ('trousers','suit_trousers')) or occasion in R.DRESSY_OCCASIONS):
        fire('T1','occasion',0.5,'top')
    # ---- PROPORTION / bands ----
    (vlo,vhi),(llo,lhi)=R.blended_band(styles)
    bands=[((vlo,vhi),(llo,lhi))]
    if F['band_union']:
        for s in det:
            if s in BANDS:
                (a,b),(l0,l1)=BANDS[s]; bands.append(((a,b),(LO.index(l0),LO.index(l1))))
    if top and top.get('volume'):
        steps=min(max(0,b0[0]-top['volume'],top['volume']-b0[1]) for b0,_ in bands)
        fire('P1_top','proportion',0.75*steps,'top')
    if bottom and bottom.get('leg_shape') in LO:
        li=LO.index(bottom['leg_shape'])
        steps=min(max(0,l[0]-li,li-l[1]) for _,l in bands)
        if F['sc_a1'] and 'smart_casual' in det and bottom['subcategory'] in ('trousers','drawstring_trousers') and bottom['leg_shape']=='wide' and (not shoes or shoes['subcategory'] in SC_SHOES): steps=0
        if F['prep_allow'] and 'classic_prep' in det and bottom['subcategory'] in ('trousers','suit_trousers','drawstring_trousers') and bottom['leg_shape']=='wide' and (not shoes or shoes['subcategory'] in LEATHER_SHOES): steps=0
        fire('P1_leg','proportion',0.75*steps,'bottom')
    if top and bottom and (top.get('volume') or 0)>=4 and bottom.get('leg_shape')=='skinny': fire('P2','proportion',0.5,'top')
    p3_skip = street_on or w('gorpcore')>=0.5
    if F['detect']: p3_skip = bool(det & {'streetwear','outdoor'}) or (vint_on and top and top['subcategory'] in VS.HERO_TOPS)
    if F['minimal_allow'] and 'minimalist' in det and ((top and top.get('length') in ('at_belt','cropped')) or (bottom and bottom['subcategory'] in ('trousers','chinos','drawstring_trousers'))): p3_skip=True
    if F['p3_cropped'] and top and top.get('length') in ('at_belt','cropped'): p3_skip=True
    if top and bottom and (top.get('volume') or 0)>=4 and bottom.get('leg_shape')=='wide' and not p3_skip: fire('P3','proportion',0.5)
    if top and top.get('shows_below_outer') and any(o['subcategory'] in R.TAILORED_OUTER for o in outer): fire('L1','fit',0.75,'top')
    if shoes and bottom and shoes['subcategory'] in ('chunky_sneaker','performance_runner') and bottom.get('leg_shape') in ('skinny','slim'):
        if not (F['s1_cinched'] and bottom['subcategory'] in ('joggers',) and bottom.get('hem') in ('cropped','cuffed')):
            fire('S1','proportion',0.75,'shoes')
    # ---- COLOR ----
    main=[g for g in gs if g['category'] in ('top','bottom','outerwear')]
    colored=[g for g in gs if g.get('color_family') and g['color_family']!='multicolor']
    acc={}
    for g in colored:
        c=g['color_family']
        if c in R.NEUTRALS: continue
        fam=R.FAMILY.get(c,c); acc[fam]=max(acc.get(fam,0),0.5 if c in R.MUTED else 1.0)
    n_acc=sum(acc.values()); fams={R.FAMILY.get(g['color_family'],g['color_family']) for g in colored}
    if n_acc>=3: fire('C1a','color',1.5)
    elif len(fams)>=5 and n_acc>=2: fire('C1b','color',0.5)
    bright_main=[g for g in main if R.is_bright(g)]
    bf={R.FAMILY.get(g['color_family'],g['color_family']) for g in bright_main}
    sb=0.5 if (shoes and R.is_bright(shoes) and R.FAMILY.get(shoes['color_family'],shoes['color_family']) not in bf) else 0
    if len(bf)+sb>=2:
        half = street_on or (F['prep_allow'] and 'classic_prep' in det and all(g['subcategory'] in PREP_HOME for g in bright_main))
        fire('C3','color',0.5 if half else 1.0)
    pats=[g for g in gs if g.get('pattern') not in (None,'solid')]; ng=[g for g in pats if g.get('pattern')!='graphic']
    seen={}
    for g in ng: k=(g.get('pattern'),g.get('pattern_scale')); seen[k]=seen.get(k,0)+1
    if any(n>=2 and k[1] not in (None,'na') for k,n in seen.items()): fire('C4a','color',1.0)
    elif any(n>=2 for n in seen.values()): fire('C4a','color',0.5)
    if len(pats)>=3 and not street_on: fire('C4b','color',1.0)
    focal=0.0
    for g in main:
        f1=1 if R.is_bright(g) else 0.5 if g['color_family'] in R.MUTED else 0
        f2=1 if (g.get('pattern') not in (None,'solid') and (g.get('pattern_scale')=='large' or g.get('pattern') in ('graphic','camo','floral'))) else 0
        focal+= max(f1,f2) if F['one_focal_per_garment'] else f1+f2
    base_allow=1.5; allowance=base_allow+(1 if street_on else 0)
    if focal>allowance: fire('B1','color',min(1.0,0.5*math.ceil(focal-allowance)))
    if F['c6'] and street_on and top and bottom and (top.get('pattern') in ('graphic','camo') or top.get('logo')=='large') and (bottom.get('pattern') in ('camo','graphic') or bottom.get('pattern_scale')=='large'):
        fire('C6','color',0.5)
    jacket=next((o for o in outer if o['subcategory'] in R.SEPARATE_JACKETS),None)
    if jacket and bottom and bottom['subcategory'] in ('trousers','chinos') and jacket['color_family'] in R.DARK_SUITING and bottom['color_family'] in R.DARK_SUITING and jacket['color_family']!=bottom['color_family']:
        fire('C5','color',0.85)
    color_fault=any(r in fired for r in ('C1a','C1b','C3','C4a','C4b','B1','C6'))
    # ---- OCCASION ----
    def fval(g):
        f=formality(g,F)
        if F['ath_o1_as2'] and g['category']=='bottom' and g['subcategory'] in LOUNGE and occasion in ('everyday','class'): f=2
        return f
    core=[fval(g) for g in gs if g['category'] in ('top','bottom','footwear','outerwear')]
    if core:
        f=sum(core)/len(core); lo,hi=R.OCCASION_TARGET.get(occasion,(2,3)); gap=lo-f
        if F['o1ramp']:
            cl=lambda x:max(0,min(1,x)); a=1.25*cl((gap-0.25)/0.5)+1.25*cl((gap-1.25)/0.5)
            fire('O1_too_casual','occasion',a)
        elif f<lo-0.5: fire('O1_too_casual','occasion',min(2.5,1.25*R.nearest(lo-f)))
        if f>hi+1.5: fire('O1_too_formal','occasion',0.5)
    if ath and occasion not in R.LOUNGE_OK:
        if F['vintage_ladder']:
            sig=VS.intent_signals(gs)
            if not F['matched_set']:
                gs2=[g for g in gs]; outs=[g['subcategory'] for g in gs if g['category']=='outerwear']; tps=[g['subcategory'] for g in gs if g['category']=='top']
                up=any(x in VS.STRUCTURED_OUTER for x in outs) or any(x in VS.DRESSED_TOPS for x in tps)
                sig=int(up)+int(shoes is not None and shoes['subcategory'] not in VS.GYM_SHOES)
            a=0.0 if vint_on else {0:1.0,1:0.5,2:0.0}[sig]
            fire('O4','occasion',a,'bottom')
        else:
            if F['detect']:
                if street_on and F['street_allow']: a=0.25 if street_anchor else 0.5
                elif vint_on: a=0
                else: a=0.5
            else: a=0 if (w('streetwear')+w('vintage_sport'))>=0.5 else 0.5
            fire('O4','occasion',a,'bottom')
    if F['s3_slides'] and shoes and shoes['subcategory']=='slides_sandals' and bottom and bottom['subcategory'] in ('jeans','cargos'):
        fire('S3','proportion',0.5,'shoes')
    if shoes:
        others=[formality(g,F) for g in gs if g['category'] in ('top','bottom','outerwear')]
        if others and shoes['subcategory']!='white_leather_sneaker':
            d=max(others)-formality(shoes,F)
            if F['s2ramp']: a=1.5*max(0,min(1,(d-2.0)/1.0))
            else: a=1.5 if d>=3 else 0
            fire('S2','occasion',a,'shoes')
    big=[g for g in gs if g.get('logo')=='large']
    if big and not (street_on or vint_on) and occasion.startswith(('work','interview')) and any(g.get('certainty')=='clear' for g in big): fire('O3','occasion',1.1)
    # ---- CREDITS ----
    cg=[g for g in gs if g['category'] in ('top','bottom','footwear','outerwear')]
    def ok(g): return not (F['stained_nocredit'] and g.get('condition')=='stained')
    def k1_val(g):
        if g['category']=='outerwear': base=True
        elif g['category']=='top' and g['subcategory'] in KNIT: base=True
        elif F['fleece_k1'] and g['subcategory'] in ('fleece',): base=True
        elif F['overshirt_layer'] and g['category']=='top' and g['subcategory'] in ('overshirt','flannel_shirt','camp_collar_shirt') and len(tops)>=2 and g is tops[0]: base=True
        else: base=False
        if not base: return 0
        if F['k1_tier'] and g['subcategory'] in TECH: return 0.5
        return 0.75
    cand={'K1':[(i,k1_val(g)) for i,g in enumerate(cg) if k1_val(g)>0 and ok(g)],
          'K2':[(i,0.5) for i,g in enumerate(cg) if formality(g,F)>=3 and ok(g)]}
    small_ok=not F['k3_nosmall']
    def interest_of(g):
        c=1 if R.is_bright(g) else 0.5 if g['color_family'] in R.MUTED else 0
        p=1 if (g.get('pattern') not in (None,'solid','graphic','other') and (small_ok or g.get('pattern_scale')!='small')) else 0
        return max(c,p) if F['one_focal_per_garment'] else c+p
    mg=[(i,g) for i,g in enumerate(cg) if g['category'] in ('top','bottom','outerwear')]
    interest=sum(interest_of(g) for _,g in mg if not (F['k3_no_care'] and gs.index(g) in care_g))
    k3_ok = 1<=interest<=allowance
    if F['k3_strict'] and (color_fault or focal>base_allow): k3_ok=False
    cand['K3']=[(i,0.5) for i,g in mg if interest_of(g)>0 and not (F['k3_no_care'] and gs.index(g) in care_g)] if k3_ok else []
    k4=[]
    if shoes and bottom:
        others=[formality(g,F) for g in gs if g['category'] in ('top','bottom','outerwear')]
        si=cg.index(shoes)
        if formality(shoes,F)>=2.5 and others and abs(formality(shoes,F)-sum(others)/len(others))<=0.75: k4=[(si,0.5)]
        if F['k4_street'] and shoes['subcategory'] in ST.ST_SHOE_CORE and bottom['subcategory'] in ('jeans','cargos') and bottom.get('leg_shape') in ('relaxed','wide'): k4=[(si,0.5)]
        if not ok(shoes): k4=[]
    cand['K4']=k4
    if F['one_credit']:
        import itertools
        ks=[k for k in cand if cand[k]]; best=(0,{})
        for r in range(len(ks),0,-1):
            for sub in itertools.combinations(ks,r):
                for pick in itertools.product(*[cand[k] for k in sub]):
                    idx=[p[0] for p in pick]
                    if len(set(idx))==len(idx):
                        v=sum(p[1] for p in pick)
                        if v>best[0]: best=(v,dict(zip(sub,[p[1] for p in pick])))
        earned=best[1]
    else:
        earned={k:max(v for _,v in cand[k]) for k in cand if cand[k]}
    hidden={'shoes'} if not_rated else set()
    vis=2.25-(0.5 if hidden else 0)
    scale=1.0 if F['noscale'] else (1+2.25/vis)/2
    credit=sum(earned.values())*scale
    # ---- totals with cap ----
    MULT={'fit':0.8,'color':0.6,'proportion':0.6,'occasion':1.2}
    pts=[[r,MULT[s]*a,gk,s] for r,s,a,gk in amts]
    if F['cap']:
        per={}
        for p in pts:
            if p[2] and p[3] in ('fit','proportion'): per.setdefault(p[2],[]).append(p)
        for gk,ps in per.items():
            t=sum(p[1] for p in ps)
            if t>1.0:
                for p in ps: p[1]*=1.0/t
    mistakes=sum(p[1] for p in pts)
    raw=max(3.0,min(10.0,7.0+credit-mistakes))
    if F['floor5'] and occasion in ('everyday','class','date','going_out','home') and 'F7_care' not in fired and 'F10' not in fired:
        raw=max(raw,5.0)
    return {'overall':R.round_half(raw),'raw':round(raw,3),'credits':earned,'fired':[(p[0],round(p[1],2)) for p in pts],'detected':sorted(det)}
