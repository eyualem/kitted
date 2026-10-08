"""Round-2 net inflation check (vintage-sport advocate). Run: /usr/bin/python3 rubric/research/style-council/r2-vintage_sport_net.py"""
import json, copy, sys, importlib.util, collections
import os
D=os.path.dirname(os.path.abspath(__file__)); X=os.path.join(D,'..','..','..','extraction-test')
sys.path[:0]=[X]
from rubric import score as now
def _load(n,p):
    s=importlib.util.spec_from_file_location(n,p); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
vs=_load('vs',D+'/r1-vintage_sport_proto.py'); r2=_load('r2',D+'/r2-vintage_sport_package.py')
rows=[]
for f in ['results/test3-stock-40-v3/raw_results.json','results/test4-mirror-12-v3/raw_results.json']:
    for r in json.load(open(X+'/'+f)):
        if r.get('extraction'): rows.append((r['outfit'],r.get('stage',''),r.get('run'),r['extraction']))
for i,p in enumerate(json.load(open(D+'/phone-checks-oct7.json'))): rows.append((f'phone{i+1}','before',0,p['reading']))
def stats(fn, first_only=False, styles=None):
    sc=[]
    for o,st,run,e in rows:
        if first_only and run!=0: continue
        if first_only and o.startswith(('p0',)) and st!='before': continue
        v=fn(copy.deepcopy(e),'everyday',styles or {})['overall']
        if v is not None: sc.append(v)
    n=len(sc); return n, sum(s>=8 for s in sc)/n, sum(s>=9 for s in sc)/n, sum(s<=5.5 for s in sc)/n, sum(sc)/n
for lab,fo in [('all readings',False),('first run / photo',True)]:
    for name,fn in [('v3.1',now),('r1 vintage proto',vs.score),('r2 package',r2.score)]:
        n,a8,a9,lo,m=stats(fn,fo); print(f"{lab:18} {name:17} n={n} 8+={a8:.0%} 9+={a9:.0%} <=5.5={lo:.0%} mean={m:.2f}")
up=down=0; moves=collections.Counter(); ex=collections.defaultdict(list)
for o,st,run,e in rows:
    a=now(copy.deepcopy(e),'everyday',{})['overall']; b=r2.score(copy.deepcopy(e),'everyday',{})['overall']
    if a is None or b is None: continue
    if b>a: up+=1
    if b<a: down+=1
    if b!=a: moves[b-a]+=1; ex[o].append(f"{a}->{b}")
print('up',up,'down',down,dict(moves))
for o,v in sorted(ex.items()): print(' ',o, sorted(set(v)))
