import sys
sys.path.insert(0, '/Users/eyu/Desktop/files/Kitted/extraction-test')
import rubric
INDIGO = {"denim_light","denim_mid","denim_dark"}
EARTH_OUTER = {"brown","tan_camel","khaki_beige","olive","off_white_cream","navy"} | INDIGO
VETO = {"sweatpants","joggers","athletic_shorts","jersey","tank_top","suit_jacket","suit_trousers","dress_shoe","slides_sandals"}
NEG = {"graphic_tee","chunky_sneaker","basketball_sneaker","performance_runner","puffer","shell_jacket","rain_jacket","fleece","blazer","sport_coat"}
def detect_workwear(ext):
    gs=[g for g in ext.get("garments",[]) if g.get("certainty")!="unsure" and g.get("category")!="accessory"]
    if not ext.get("scene",{}).get("shoes_visible",True):
        gs=[g for g in gs if g["category"]!="footwear"]
    pts=0; anchors=0; slots=set(); why=[]
    for g in gs:
        s=g["subcategory"]; c=g["color_family"]; cat=g["category"]
        if s in VETO: return False, 0, ["veto:"+s]
        a=sup=0
        if s in ("chore_coat","work_boot","work_pants"): a=1
        elif s in ("field_jacket","denim_jacket") and c in EARTH_OUTER: a=1
        elif s in ("field_jacket","denim_jacket","overshirt","flannel_shirt","suede_chukka","cargos","leather_jacket"): sup=1
        elif s=="jeans" and g.get("leg_shape")!="skinny": sup=1
        if s=="flannel_shirt" and any(h["subcategory"] in ("jeans","cargos") for h in gs): a=1; sup=0
        if a: pts+=2; anchors+=1; slots.add(cat); why.append("A:"+s)
        elif sup: pts+=1; slots.add(cat); why.append("s:"+s)
        if s in NEG: pts-=1; why.append("-"+s)
        if g.get("logo")=="large": pts-=1; why.append("-logo")
        if (g.get("volume") or 3)>=5: pts-=1; why.append("-vol5")
    main=[g for g in gs if g["category"] in ("top","bottom","outerwear")]
    if sum(1 for g in main if rubric.is_bright(g))>=2: return False, pts, why+["veto:2 brights"]
    return anchors>=1 and len(slots)>=2 and pts>=3, pts, why
