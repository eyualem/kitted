import sys; sys.dont_write_bytecode=True
sys.path.insert(0,"/Users/eyu/Desktop/files/Kitted/handoff/fixtures")
import kitted_logic as kl
from scen import R, g
def top(sub,col,**k): return g("top",sub,col,**k)
def bot(sub,col,leg,hem,**k): return g("bottom",sub,col,leg_shape=leg,hem=hem,length="na",tucked="na",sleeve_end="na",**k)
def sh(sub,col,**k): return g("footwear",sub,col,length="na",tucked="na",sleeve_end="na",**k)
GR=dict(pattern="graphic",pattern_scale="large")
rows=[
 ("graphic tee + tan cargo shorts + skate sneakers",7.5,[top("graphic_tee","white",volume=5,**GR),bot("shorts","khaki_beige","wide","na"),sh("canvas_sneaker","blue")]),
 ("striped hoodie + dark baggy jeans + chunky",8,[top("hoodie","red",volume=4,pattern="stripes",pattern_scale="medium",saturation="bright"),bot("jeans","denim_dark","relaxed","full_break"),sh("chunky_sneaker","black")]),
 ("cream graphic zip hoodie + light wide jeans + tan boots",7,[top("hoodie","off_white_cream",volume=4,**GR),bot("jeans","denim_light","wide","full_break"),sh("work_boot","tan_camel")]),
 ("black graphic tee + dark wide jeans pooling + white high-tops",7,[top("graphic_tee","black",volume=5,**GR),bot("jeans","denim_dark","wide","pooling"),sh("basketball_sneaker","white")]),
 ("busy: leopard tee + long tee under + rhinestone shorts + boots",5,[top("graphic_tee","black",volume=5,**GR),top("tee","white",shows_below_outer=True,length="below_crotch"),bot("shorts","black","wide","na",pattern="other",pattern_scale="medium"),sh("work_boot","tan_camel")]),
 ("black LS graphic + tan cargo shorts + black sneakers",8,[top("graphic_tee","black",**GR),bot("shorts","khaki_beige","wide","na"),sh("canvas_sneaker","black")]),
 ("purple graphic zip hoodie + light extra-wide jeans + pink shoes",9,[top("hoodie","purple",volume=4,saturation="bright",**GR),bot("jeans","denim_light","wide","pooling"),sh("retro_runner","pink",saturation="bright")]),
 ("soccer jersey + camo cargo shorts + white sneakers",8,[top("jersey","white",volume=5,pattern="stripes",pattern_scale="medium"),bot("shorts","olive","wide","na",pattern="camo",pattern_scale="medium"),sh("retro_runner","white")]),
 ("black LS top + light relaxed jeans + black shoes",8,[top("tee","black"),bot("jeans","denim_light","relaxed","full_break"),sh("low_profile_sneaker","black")]),
 ("Venom graphic tee + distressed denim shorts + blue high-tops",2,[top("graphic_tee","white",volume=5,**GR),bot("shorts","denim_light","wide","na",distressed_by_design=True),sh("basketball_sneaker","blue",saturation="bright")]),
 ("blue graphic tee + dark wide studded jeans + grey sneakers",6,[top("graphic_tee","blue",volume=5,**GR),bot("jeans","denim_dark","wide","full_break",distressed_by_design=True),sh("retro_runner","grey")]),
 ("cream patterned knit + light baggy jeans + chunky",8.5,[top("sweater","off_white_cream",volume=4,pattern="other",pattern_scale="medium"),bot("jeans","denim_light","wide","pooling"),sh("chunky_sneaker","white")]),
 ("grey zip hoodie + blue straight jeans + sneakers",5,[top("hoodie","grey"),bot("jeans","denim_mid","straight","slight_break"),sh("retro_runner","white")]),
 ("white graphic hoodie + pink washed baggy jeans + blue high-tops",8.5,[top("hoodie","white",volume=4,**GR),bot("jeans","pink","wide","full_break",saturation="muted"),sh("basketball_sneaker","blue")]),
 ("hockey jersey + black slim joggers + sneakers",6.5,[top("jersey","white",volume=5,pattern="stripes",pattern_scale="medium"),bot("joggers","black","slim","cuffed"),sh("low_profile_sneaker","black")]),
 ("black LS pink graphics + embellished shorts + runners",5,[top("graphic_tee","black",**GR),bot("shorts","black","wide","na",pattern="other",pattern_scale="medium"),sh("performance_runner","black")]),
 ("black Supreme jersey + black baggy pants + high-tops",8,[top("jersey","black",volume=5,logo="large"),bot("cargos","black","wide","full_break"),sh("basketball_sneaker","black")]),
 ("black polo tucked + light wide jeans + sneakers",7,[top("polo","black",tucked="full",logo="small"),bot("jeans","denim_light","wide","full_break"),sh("low_profile_sneaker","black")]),
 ("camo hoodie + dark wide jeans + black/red sneakers",6,[top("hoodie","olive",volume=4,pattern="camo",pattern_scale="large"),bot("jeans","denim_dark","wide","full_break"),sh("retro_runner","black")]),
 ("black graphic sweatshirt + ripped light wide jeans + tan boots",9,[top("sweatshirt","black",volume=4,**GR),bot("jeans","denim_light","wide","full_break",distressed_by_design=True),sh("work_boot","tan_camel")]),
]
def rank(x):
    s=sorted(range(len(x)),key=lambda i:x[i]); r=[0]*len(x); i=0
    while i<len(s):
        j=i
        while j+1<len(s) and x[s[j+1]]==x[s[i]]: j+=1
        for k in range(i,j+1): r[s[k]]=(i+j)/2
        i=j+1
    return r
def spear(a,b):
    ra,rb=rank(a),rank(b); n=len(a); ma=sum(ra)/n; mb=sum(rb)/n
    num=sum((x-ma)*(y-mb) for x,y in zip(ra,rb)); den=(sum((x-ma)**2 for x in ra)*sum((y-mb)**2 for y in rb))**.5
    return num/den
H=[];O=[]
for name,human,gs in rows:
    s=kl.score(R(*gs),"everyday")
    H.append(human);O.append(s["overall"])
    print(f"{human:>4} vs {s['overall']:>4}  {name[:62]:62s} {','.join(s['credits'])} | {','.join(s['rules_fired'])}")
print("spearman",round(spear(H,O),2),"mean human",sum(H)/len(H),"mean ours",sum(O)/len(O),"MAE",round(sum(abs(a-b) for a,b in zip(H,O))/len(H),2))
print("ours range",min(O),max(O),"human range",min(H),max(H))
