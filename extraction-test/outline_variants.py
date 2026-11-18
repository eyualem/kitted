#!/usr/bin/env python3
"""The outline's steadier variants (Nov 17, 2026; $0): each held out (the approved v16 sizes held, only the outline
sizes fitted on each half A, seeds 1-8) and its steadiness (B6) with each gold reading's own looks U, L and leg ("all":
the app's case) and with the leg look only ("leg": his Y44 count, which can't see look U's hem).

  KITTED_DATA=<main checkout> /usr/bin/python3 outline_variants.py     -> results/outline1/variants.txt
"""
import sys, random, statistics as st
from pathlib import Path
sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE / 'rubrics'))
import parts_proto as P, v16_paper as V, steadiness as SD, outline_audit as A
import outline_paper as OP
pool, ks = A.load_pool(); his={k:pool[k][0] for k in ks}; score=OP.Scorer(pool)
APP=dict(P.TUNE["v16"]["taste"])
LINES=["variant                              held out (8 splits)    B6 all / leg (bar 218)   sizes fitted on all 164"]
def run(name, fixed_ol, grid):
    res=[]
    for seed in range(1,9):
        sh=ks[:]; random.Random(seed).shuffle(sh); A_,B_=sorted(sh[:82]),sorted(sh[82:])
        flat=dict(APP, **{"ol."+k:v for k,v in fixed_ol.items()}, **{k:v[0] for k,v in grid.items()})
        hA=[his[k] for k in A_]; best=OP.obj([score(k,OP.build(flat)) for k in A_],hA)
        for _ in range(3):
            mv=False
            for n,vals in grid.items():
                for v in vals:
                    c=dict(flat,**{n:v}); o=OP.obj([score(k,OP.build(c)) for k in A_],hA)
                    if o>best+1e-9: best,flat,mv=o,c,True
            if not mv: break
        xs=[score(k,OP.build(flat)) for k in B_]; hv=[his[k] for k in B_]
        res.append((OP.w1(xs,hv)/82, V.pearson(xs,hv)))
    # all-164 fit
    flat=dict(APP, **{"ol."+k:v for k,v in fixed_ol.items()}, **{k:v[0] for k,v in grid.items()})
    hA=[his[k] for k in ks]; best=OP.obj([score(k,OP.build(flat)) for k in ks],hA)
    for _ in range(3):
        mv=False
        for n,vals in grid.items():
            for v in vals:
                c=dict(flat,**{n:v}); o=OP.obj([score(k,OP.build(c)) for k in ks],hA)
                if o>best+1e-9: best,flat,mv=o,c,True
        if not mv: break
    T=OP.build(flat); P.TUNE["v16"]["taste"]=T
    s,n,_=SD.steadiness(None, looks="all"); s2,_,_=SD.steadiness(None, looks="leg")
    P.TUNE["v16"]["taste"]=APP
    LINES.append(f"{name:36s} {100*st.mean(x[0] for x in res):.1f}% r {st.mean(x[1] for x in res):.3f}      {s}/{n} / {s2}            {T.get('outline')}")
    print(LINES[-1], flush=True)


M=[0,0.25,0.5,0.75,1.0]; F=[0,0.25,0.5]
B={"mid_block":True}
VARIANTS=[
 ("the proposal: mid+short+long", B, {"ol.mid":M,"ol.mid_full":F,"ol.short":F,"ol.long":F}),
 ("mid+long, no short", dict(B, short=0), {"ol.mid":M,"ol.mid_full":F,"ol.long":F}),
 ("mid+long, no block", {}, {"ol.mid":M,"ol.mid_full":F,"ol.long":F}),
 ("hip at half: mid+short+long", dict(B, hip_factor=0.5), {"ol.mid":M,"ol.mid_full":F,"ol.short":F,"ol.long":F}),
 ("crotch only: mid+long", dict(B, hip_factor=0.0), {"ol.mid":M,"ol.mid_full":F,"ol.long":F}),
 ("reads agree: mid+short+long", dict(B, agree=True), {"ol.mid":M,"ol.mid_full":F,"ol.short":F,"ol.long":F}),
 ("border agree: mid+short+long", dict(B, agree="border"), {"ol.mid":M,"ol.mid_full":F,"ol.short":F,"ol.long":F}),
 ("creators: tailored spared, hip on layers only", dict(B, tailored_ok=True, mid_layers_only=True), {"ol.mid":M,"ol.mid_full":F,"ol.short":F,"ol.long":F}),
 ("tailored spared: mid+short+long", dict(B, tailored_ok=True), {"ol.mid":M,"ol.mid_full":F,"ol.short":F,"ol.long":F}),
 ("layers only: mid+short+long", dict(B, only="outer"), {"ol.mid":M,"ol.mid_full":F,"ol.short":F,"ol.long":F}),
 ("layers only, hip half: mid+long", dict(B, only="outer", hip_factor=0.5), {"ol.mid":M,"ol.mid_full":F,"ol.long":F}),
]
for name, fx, grid in VARIANTS:
    run(name, fx, grid)
(HERE / "results" / "outline1" / "variants.txt").write_text("\n".join(LINES) + "\n")
