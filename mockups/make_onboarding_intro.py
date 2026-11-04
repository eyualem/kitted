#!/usr/bin/env python3
"""Builds mockups/onboarding-intro.html: three ways for the start of onboarding to say what Kitted does (Nov 4, 2026).
Every phone is drawn twice, light and dark, from the app's tokens (03-design-system.md §2, the fixed ink-3 values).
The example check's words are the engine's own (exampleCheck() on s14: 7.5, the sneaker swap -> 8.0, 4 pieces).
Run: python3 mockups/make_onboarding_intro.py"""
import base64
from pathlib import Path

OUT = Path(__file__).with_name("onboarding-intro.html")
PHOTO = "data:image/jpeg;base64," + base64.b64encode(Path(__file__).with_name("img").joinpath("s14.jpg").read_bytes()).decode()

# --- small drawn pieces (the closet's flats, simplified) ---------------------------------------------------------
JACKET = '<svg viewBox="0 0 60 60"><path d="M20 8l10 4 10-4 12 6-4 18-6-2v24H18V30l-6 2-4-18z" fill="#3A3F4A"/><path d="M30 12v44" stroke="#22262E" stroke-width="1.4"/><rect x="21" y="22" width="6" height="5" rx="1" fill="#2A2E36"/><rect x="33" y="22" width="6" height="5" rx="1" fill="#2A2E36"/></svg>'
SWEATER = '<svg viewBox="0 0 60 60"><path d="M23 7h14v6l13 5-4 20-5-2v20H19V36l-5 2-4-20 13-5z" fill="#F4F2EE" stroke="#C9CBD1" stroke-width="1"/><rect x="23" y="5" width="14" height="7" rx="2" fill="#F4F2EE" stroke="#C9CBD1" stroke-width="1"/></svg>'
TROUSERS = '<svg viewBox="0 0 60 60"><path d="M17 6h26l3 50H33l-3-34-3 34H14z" fill="#8C9099"/><path d="M17 10h26" stroke="#6E727B" stroke-width="2"/><path d="M28 10l-2 6M32 10l2 6" stroke="#E9EAEE" stroke-width="1"/></svg>'
SNEAKER = '<svg viewBox="0 0 60 60"><path d="M6 36c4-1 9-8 13-12l7 4c6 3 14 4 22 6 4 1 6 4 6 8v4H6z" fill="#9A9DA4"/><path d="M6 44h48v6H6z" fill="#C7C9CE"/><path d="M18 30l4 3M22 27l4 3M26 25l3 3" stroke="#E9EAEE" stroke-width="1.4"/></svg>'
PIECES = [(JACKET, "Charcoal denim jacket"), (SWEATER, "White sweater"), (TROUSERS, "Grey drawstring trousers"), (SNEAKER, "Grey chunky sneakers")]

STATUS = '''<div class="status{dk}"><span>9:41</span><span class="sig"><svg viewBox="0 0 19 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor"/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="currentColor"/><rect x="10" y="3" width="3" height="9" rx="1" fill="currentColor"/><rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor"/></svg><svg viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="18" height="9" rx="2" fill="currentColor"/><rect x="25" y="4.5" width="1.6" height="4" rx=".8" fill="currentColor" opacity=".4"/></svg></span></div>'''


def phone(theme, inner, status_dark=False, label=""):
    """status_dark: the clock goes dark over the light hero photo in either theme (as WelcomeScreen does)."""
    st = STATUS.replace("{dk}", " ondark-photo" if status_dark else "")
    return f'''<div class="ph-wrap"><div class="phone t-{theme}" role="img" aria-label="{label} ({theme})"><div class="screen">{st}<div class="island"></div>{inner}<div class="homebar"></div></div></div><span class="ph-cap">{theme.capitalize()}</span></div>'''


def pair(inner_fn, status_dark=False, label=""):
    return f'<div class="pair">{phone("light", inner_fn("light"), status_dark, label)}{phone("dark", inner_fn("dark"), status_dark, label)}</div>'


def hero(h=455):
    return f'<div class="hero" style="height:{h}px"><div class="photo"></div><div class="fade"></div></div>'


ACCOUNT = '<div class="acct" title="Owned by the sign-in session; shown only once accounts are on">I already have an account</div>'


def buttons(primary, ghost):
    return f'<div class="btns"><div class="btn p">{primary}</div><div class="btn ghost">{ghost}</div>{ACCOUNT}</div>'


def mini_card():
    return '''<div class="card mini"><div class="tag"><span>Fit check</span><span>Everyday</span></div><div class="srow"><span class="num" style="font-size:52px">7.5</span><span class="vd"><b>Put together</b><span>Full check</span></span></div></div>'''


# --- Today ---------------------------------------------------------------------------------------------------------
def today(theme):
    return hero() + mini_card() + f'''<div class="bottom"><span class="woven sm">KITTED</span><div class="h1">Look put together.<br>Without trying<br>too hard.</div><div class="body">Send a fit. Get a score out of 10 and the two or three moves that raise it.</div>{buttons("Get started", "See an example check")}</div>'''


# --- B: one screen that plays one real check ------------------------------------------------------------------------
def demo_card(stage=4, anim=False):
    """stage 1 photo chip, 2 reading, 3 score, 4 fix + closet (the resting frame)."""
    cls = " anim" if anim else ""
    reading = '<div class="dc-read d2"><span class="dot"></span>Reading your fit</div>' if stage == 2 else ""
    score = f'<div class="srow d3"><span class="num" style="font-size:50px">7.5</span><span class="vd"><b>Put together</b><span>Everyday</span></span></div>' if stage >= 3 else ""
    fix = '<div class="dc-fix d4"><span class="n">1</span><span class="w">Swap the chunky sneakers for low-profile sneakers</span><span class="g">→ 8.0</span></div><div class="dc-closet d5"><span class="plus">+</span>Added 4 to your closet</div>' if stage >= 4 else ""
    card = f'<div class="card demo{cls}"><div class="tag"><span>Fit check</span><span>Full</span></div>{reading}{score}{fix}</div>' if stage >= 2 else ""
    chip = f'<div class="chip-photo d1{cls}"><svg viewBox="0 0 20 20"><path d="M3 7h3l1.5-2h5L14 7h3v9H3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="10" cy="11.5" r="2.8" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>Your fit pic</div>'
    return chip + card


def dirB(theme, stage=4, anim=False):
    return hero(430) + f'<div class="demo-slot{" anim" if anim else ""}">{demo_card(stage, anim)}</div>' + f'''<div class="bottom"><span class="woven sm">KITTED</span><div class="h1">Send a fit pic.<br>Get a score and<br>the one fix.</div><div class="body">It rates the outfit, never you, and learns your closet as you go. Your daily check is free.</div>{buttons("Get started", "See an example check")}</div>'''


def dirB_anim(theme):
    return dirB(theme, 4, True)


# --- A: three cards ------------------------------------------------------------------------------------------------
def a_shell(art, title, body, page, btn):
    dots = "".join(f'<i class="{"on" if i == page else ""}"></i>' for i in range(3))
    skip = '<div class="skip">Skip</div>' if page < 2 else ""
    return f'''<div class="a-top">{skip}</div><div class="a-art">{art}</div><div class="a-text"><div class="dots">{dots}</div><div class="h2">{title}</div><div class="body">{body}</div></div><div class="a-btns"><div class="btn p">{btn}</div>{ACCOUNT if page == 0 else ''}</div>'''


def a1(theme):
    art = '<div class="cam"><div class="photo"></div><span class="br tl"></span><span class="br tr"></span><span class="br bl"></span><span class="br bot"></span><div class="cam-pill">Hold still · 2</div></div>'
    return a_shell(art, "Snap your fit.", "Prop your phone up or use a mirror. Your face is blurred before anything is sent.", 0, "Next")


def a2(theme):
    art = '''<div class="card big"><div class="tag"><span>Fit check · Full</span><span>Everyday</span></div><div class="srow"><span class="num" style="font-size:76px">7.5</span><span class="slash">/10</span><span class="vd"><b>Put together</b><span>Good base. Swapping one piece gets you to 8.0.</span></span></div><div class="seam"></div><div class="dc-fix"><span class="n">1</span><span class="w">Swap the chunky sneakers for low-profile sneakers<small>Raises Shoes to 8 · free if you own one</small></span><span class="g">→ 8.0</span></div></div>'''
    return a_shell(art, "Get a score and the one fix.", "Out of 10, with the one change that raises it. Same photo, same score.", 1, "Next")


def tiles(n=4, small=False):
    t = "".join(f'<div class="tile{" sm" if small else ""}"><div class="tile-art">{svg}</div><span>{name}</span></div>' for svg, name in PIECES[:n])
    return f'<div class="tiles">{t}</div>'


def a3(theme):
    art = f'<div class="card closet"><div class="tag"><span>Closet</span><span>4 pieces</span></div>{tiles()}<div class="dc-closet"><span class="plus">+</span>Added 4 from your first check</div></div>'
    return a_shell(art, "It learns your closet.", "Every check adds your pieces, so outfit ideas come from clothes you already own.", 2, "Get started")


# --- C: the example check is the main path ----------------------------------------------------------------------
def c1(theme):
    return hero() + mini_card() + f'''<div class="bottom"><span class="woven sm">KITTED</span><div class="h1">Look put together.<br>Without trying<br>too hard.</div><div class="body">Send a fit pic. Get a score out of 10 and the one fix that raises it.</div>{buttons("See how it works", "Skip to setup")}</div>'''


def c2(theme):
    return '''<div class="nav"><span class="circ">‹</span><span class="nav-t">How it works</span><span class="circ ghost"></span></div><div class="thread"><div class="kit"><span class="who">Kit</span><div class="kb">Here's a real check. This is what you'll get from your own photo.</div></div><div class="me-photo"><div class="photo"></div><span class="cap">Everyday · Example</span><span class="callout c1">1</span></div><div class="card ex"><div class="tag"><span>Example · Full</span><span>Everyday</span></div><div class="srow"><span class="num" style="font-size:64px">7.5</span><span class="slash">/10</span><span class="vd"><b>Put together</b><span>Good base. Swapping one piece gets you to 8.0.</span></span><span class="callout c2">2</span></div><div class="seam"></div><div class="dc-fix"><span class="n">1</span><span class="w">Swap the chunky sneakers for low-profile sneakers<small>Raises Shoes to 8 · free if you own one</small></span><span class="g">→ 8.0</span><span class="callout c3">3</span></div><div class="seam"></div><div class="dc-closet"><span class="plus">+</span>Added 4 to your closet<span class="callout c4">4</span></div></div><div class="legend"><p><b>1</b> Send a fit pic. Your face is blurred first.</p><p><b>2</b> A score out of 10. Same photo, same score.</p><p><b>3</b> The one fix, and what it gets you.</p><p><b>4</b> Your pieces go in your closet for outfit ideas.</p></div></div><div class="dock"><div class="btn p">Check my own fit</div></div>'''


CSS = r'''
:root{
  /* Layout: a review board like mockups/kitted-mockups.html: fitting-room grey page, phones in light/dark pairs. */
  --page:#E5E7EB; --page-2:#F1F2F4; --page-ink:#131726; --page-ink-2:#565C6B; --page-line:#C8CCD4; --rivet:#9C5326;
  --display:"Archivo","Helvetica Neue",Arial,sans-serif;
  --ios:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",Arial,sans-serif;
  --mono:ui-monospace,"SF Mono",Menlo,monospace;
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--page:#0A0C11;--page-2:#11141B;--page-ink:#E8EAF0;--page-ink-2:#9198A7;--page-line:#252A37;--rivet:#D8915A;color-scheme:dark}}
:root[data-theme="dark"]{--page:#0A0C11;--page-2:#11141B;--page-ink:#E8EAF0;--page-ink-2:#9198A7;--page-line:#252A37;--rivet:#D8915A;color-scheme:dark}
.t-light{--bg:#F3F4F6;--surface:#FFFFFF;--surface-2:#ECEEF1;--ink:#121628;--ink-2:#585E70;--ink-3:#646A7A;--faint:#848A99;--line:#E0E3E8;--accent:#9C5326;--accent-soft:rgba(156,83,38,.09);--primary:#121628;--on-primary:#FFFFFF;--good:#2B7651;--me:#1B2340;--on-me:#F2F3F7;--shadow:0 1px 2px rgba(18,22,40,.05),0 6px 18px rgba(18,22,40,.06);--bezel:#1B1D22}
.t-dark{--bg:#0C0E14;--surface:#171A23;--surface-2:#21252F;--ink:#ECEEF3;--ink-2:#A1A7B5;--ink-3:#9096A5;--faint:#6E7484;--line:#2A2F3B;--accent:#DE9762;--accent-soft:rgba(222,151,98,.15);--primary:#ECEEF3;--on-primary:#0C0E14;--good:#5DC08F;--me:#2A3150;--on-me:#EEF0F6;--shadow:0 0 0 1px rgba(255,255,255,.03);--bezel:#2A2D34}
*{box-sizing:border-box}
html,body{background:var(--page);color:var(--page-ink)}
body{font-family:var(--ios);-webkit-font-smoothing:antialiased;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:0 72px}
.board{max-width:1240px;margin:0 auto}
h1,h2,h3{text-wrap:balance}
.mast{padding-block:44px 28px;border-bottom:1px solid var(--page-line);display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:32px;align-items:end}
.mast h1{font-family:var(--display);font-stretch:118%;font-weight:720;font-size:clamp(30px,5vw,54px);line-height:1;letter-spacing:-.025em;margin:10px 0 0}
.eyebrow{font-family:var(--mono);font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--rivet)}
.lede{font-size:15.5px;line-height:1.55;color:var(--page-ink-2);margin:0;max-width:62ch}
.lede b{color:var(--page-ink)}
.pick{margin-top:28px;background:var(--page-2);border:1px solid var(--page-line);border-radius:14px;padding:20px 22px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.pick div{min-width:0}
.pick h3{margin:0 0 6px;font-size:15px;display:flex;gap:8px;align-items:baseline}
.pick h3 small{font-family:var(--mono);font-weight:500;font-size:11px;color:var(--rivet);letter-spacing:.04em}
.pick p{margin:0;font-size:13.5px;line-height:1.5;color:var(--page-ink-2)}
.pick .rec{outline:2px solid var(--rivet);outline-offset:8px;border-radius:6px}
section.dir{padding-block:52px 4px;border-bottom:1px dashed var(--page-line)}
.dir-head{display:grid;grid-template-columns:minmax(0,340px) minmax(0,1fr);gap:14px 40px;margin-bottom:28px}
.dir-head h2{margin:6px 0 0;font-family:var(--display);font-stretch:112%;font-weight:700;font-size:28px;letter-spacing:-.02em;line-height:1.08}
.dir-head p{margin:0 0 10px;font-size:14.5px;line-height:1.55;color:var(--page-ink-2);max-width:66ch}
.facts{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
.fact{font-family:var(--mono);font-size:11.5px;padding:5px 9px;border-radius:999px;border:1px solid var(--page-line);color:var(--page-ink-2)}
.fact.good{color:var(--page-ink);border-color:var(--page-ink-2)}
.row{display:flex;flex-wrap:wrap;gap:34px 30px;align-items:flex-start}
.pair{display:flex;gap:14px;flex-wrap:wrap}
.ph-wrap{display:flex;flex-direction:column;align-items:center;gap:8px}
.ph-cap{font-family:var(--mono);font-size:11px;color:var(--page-ink-2)}
.shot-label{font-size:13.5px;font-weight:650;margin:0 0 10px}
.shot-label span{font-weight:400;color:var(--page-ink-2)}
.words{margin-top:26px;background:var(--page-2);border:1px solid var(--page-line);border-radius:12px;padding:16px 20px;max-width:880px}
.words h4{margin:0 0 8px;font-family:var(--mono);font-weight:500;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--rivet)}
.words ul{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:5px;font-size:14px;line-height:1.45}
.words li span{color:var(--page-ink-2)}
.research{padding-block:48px 0}
.research ol{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:10px;font-size:14.5px;line-height:1.55;max-width:80ch}
.research ol li b{font-weight:650}
.research .src{font-size:12.5px;color:var(--page-ink-2)}
.research a{color:var(--rivet)}
.cmp{overflow-x:auto;margin-top:18px}
.cmp table{border-collapse:collapse;font-size:13px;min-width:720px}
.cmp th,.cmp td{text-align:left;padding:8px 12px 8px 0;border-bottom:1px solid var(--page-line);vertical-align:top}
.cmp th{font-family:var(--mono);font-weight:500;font-size:11px;color:var(--page-ink-2);text-transform:uppercase;letter-spacing:.06em}
.story{display:flex;gap:12px;flex-wrap:wrap;margin-top:6px}
.replay{margin-top:12px;font:inherit;font-size:13px;font-weight:600;padding:8px 14px;border-radius:999px;border:1px solid var(--page-line);background:var(--page-2);color:var(--page-ink);cursor:pointer}
.replay:focus-visible{outline:2px solid var(--rivet);outline-offset:2px}

/* ---------- phone ---------- */
.phone{zoom:.62;width:428px;height:900px;border-radius:71px;background:var(--bezel);padding:13px;position:relative;box-shadow:0 0 0 1.5px rgba(128,132,145,.35),0 30px 60px -26px rgba(16,20,36,.35);flex:none}
.story .phone{zoom:.42}
.screen{position:relative;width:402px;height:874px;border-radius:58px;overflow:hidden;background:var(--bg);color:var(--ink);font-size:17px;line-height:1.3;letter-spacing:-.005em;font-variant-numeric:tabular-nums}
.island{position:absolute;top:11px;left:50%;transform:translateX(-50%);width:125px;height:37px;border-radius:19px;background:#000;z-index:30}
.status{position:absolute;top:0;left:0;right:0;height:58px;display:flex;align-items:center;justify-content:space-between;padding:4px 34px 0 50px;font-weight:600;font-size:17px;z-index:25;color:var(--ink)}
.status.ondark-photo{color:#121628}
.status .sig{display:flex;gap:6px;align-items:center}.status .sig svg:first-child{width:19px;height:12px}.status .sig svg:last-child{width:27px;height:13px}
.homebar{position:absolute;bottom:9px;left:50%;transform:translateX(-50%);width:135px;height:5px;border-radius:4px;background:var(--ink);opacity:.85;z-index:40}
.hero{position:absolute;top:0;left:0;right:0;overflow:hidden}
/* s14 shown from 0.235 of its height down (HERO_NECK): nothing above the collar. */
.photo{position:absolute;inset:0;background:url(__PHOTO__) no-repeat;background-size:480px 600px;background-position:center -144px}
.fade{position:absolute;left:0;right:0;bottom:-1px;height:62%;background:linear-gradient(to bottom,transparent,var(--bg))}
.card{background:var(--surface);border:1px solid var(--line);border-radius:24px;box-shadow:var(--shadow)}
.tag{display:flex;justify-content:space-between;gap:8px;font-family:var(--mono);font-size:12px;font-weight:500;color:var(--ink-3)}
.srow{display:flex;align-items:flex-end;gap:10px;position:relative}
.num{font-family:var(--display);font-stretch:70%;font-weight:640;line-height:.82;letter-spacing:-.025em;color:var(--ink)}
.slash{font-family:var(--mono);font-size:15px;color:var(--ink-3);margin-left:-4px;margin-bottom:2px}
.vd{display:flex;flex-direction:column;gap:2px;min-width:0}
.vd b{font-size:16px;font-weight:600}
.vd span{font-size:12.5px;color:var(--ink-2);line-height:1.3}
.mini{position:absolute;top:125px;right:21px;padding:13px 14px;display:flex;flex-direction:column;gap:8px;border-radius:21px;min-width:176px}
.bottom{position:absolute;left:0;right:0;bottom:0;padding:0 28px 34px;display:flex;flex-direction:column;gap:14px}
.woven{display:inline-flex;align-self:flex-start;position:relative;background:#1B2340;color:#EEF0F5;font-family:var(--display);font-stretch:125%;font-weight:700;letter-spacing:.32em;font-size:11px;padding:6px 16px 6px 19px;border-radius:2px;line-height:1}
.woven::before,.woven::after{content:"";position:absolute;top:3px;bottom:3px;border-left:1px dashed rgba(238,240,245,.55)}.woven::before{left:5px}.woven::after{right:5px}
.h1{font-size:34px;font-weight:700;letter-spacing:-.025em;line-height:1.08}
.h2{font-size:28px;font-weight:700;letter-spacing:-.02em;line-height:1.12}
.body{font-size:17px;color:var(--ink-2);line-height:1.4}
.btns{display:flex;flex-direction:column;gap:2px;margin-top:6px}
.btn{height:54px;border-radius:999px;display:grid;place-items:center;font-size:17px;font-weight:600}
.btn.p{background:var(--primary);color:var(--on-primary)}
.btn.ghost{height:44px;color:var(--ink)}
.acct{height:36px;display:grid;place-items:center;font-size:15px;font-weight:600;color:var(--ink-2);border:1px dashed var(--line);border-radius:10px;margin:2px 40px 0}
/* B: the demo card */
.demo-slot{position:absolute;inset:0;pointer-events:none}
.chip-photo{position:absolute;left:20px;top:330px;display:flex;gap:6px;align-items:center;padding:7px 11px;border-radius:999px;background:rgba(14,17,28,.80);color:#fff;font-size:13px;font-weight:600}
.chip-photo svg{width:17px;height:17px}
.demo{position:absolute;top:96px;right:12px;width:214px;padding:13px 14px;display:flex;flex-direction:column;gap:9px;border-radius:21px}
.dc-read{display:flex;gap:8px;align-items:center;font-size:14px;font-weight:600;color:var(--ink-2)}
.dc-read .dot{width:8px;height:8px;border-radius:50%;background:var(--accent)}
.dc-fix{display:flex;gap:9px;align-items:flex-start;position:relative}
.dc-fix .n{flex:none;width:21px;height:21px;border-radius:50%;border:1.5px solid var(--ink);display:grid;place-items:center;font-size:12px;font-weight:700}
.dc-fix .w{flex:1;min-width:0;font-size:13px;font-weight:600;line-height:1.28}
.dc-fix .w small{display:block;font-size:12px;font-weight:400;color:var(--ink-2);margin-top:2px}
.dc-fix .g{flex:none;font-family:var(--mono);font-size:13.5px;font-weight:500;color:var(--accent)}
.dc-closet{display:flex;gap:7px;align-items:center;font-size:13px;color:var(--ink-2);position:relative}
.dc-closet .plus{width:17px;height:17px;border-radius:50%;background:var(--good);color:var(--surface);display:grid;place-items:center;font-size:13px;font-weight:700;line-height:1}
.seam{height:0;border-top:1.5px dashed var(--faint);opacity:.45;margin:2px -14px}
/* A */
.a-top{position:absolute;top:58px;left:0;right:0;height:44px;display:flex;justify-content:flex-end;padding:0 22px;align-items:center}
.skip{font-size:17px;font-weight:600;color:var(--ink-2)}
.a-art{position:absolute;top:118px;left:28px;right:28px;height:384px;display:grid;place-items:center}
.cam{position:relative;width:250px;height:370px;border-radius:26px;overflow:hidden;background:#222}
.cam .photo{background-size:330px 412px;background-position:center -99px}
.br{position:absolute;width:30px;height:30px;border:3px solid #fff;border-radius:4px}
.br.tl{top:18px;left:18px;border-right:0;border-bottom:0}.br.tr{top:18px;right:18px;border-left:0;border-bottom:0}.br.bl{bottom:18px;left:18px;border-right:0;border-top:0}.br.bot{bottom:18px;right:18px;border-left:0;border-top:0}
.cam-pill{position:absolute;left:50%;bottom:28px;transform:translateX(-50%);background:rgba(255,255,255,.92);color:#121628;font-size:14px;font-weight:650;padding:8px 14px;border-radius:999px;white-space:nowrap}
.big{width:100%;padding:18px 18px 14px;display:flex;flex-direction:column;gap:12px}
.big .vd b{font-size:18px}.big .vd span{font-size:13.5px}
.closet{width:100%;padding:16px;display:flex;flex-direction:column;gap:12px}
.tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.tile{display:flex;flex-direction:column;gap:6px;min-width:0}
.tile-art{aspect-ratio:1/1;border-radius:14px;background:var(--surface-2);display:grid;place-items:center}
.tile-art svg{width:64%;height:64%}
.tile span{font-size:12.5px;color:var(--ink-2);line-height:1.25}
.a-text{position:absolute;left:28px;right:28px;top:524px;display:flex;flex-direction:column;gap:10px}
.dots{display:flex;gap:6px;margin-bottom:4px}.dots i{width:7px;height:7px;border-radius:50%;background:var(--line)}.dots i.on{background:var(--ink);width:20px;border-radius:4px}
.a-btns{position:absolute;left:28px;right:28px;bottom:34px;display:flex;flex-direction:column;gap:6px}
/* C */
.nav{position:absolute;top:58px;left:0;right:0;height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 16px}
.circ{width:44px;height:44px;border-radius:50%;background:var(--surface-2);display:grid;place-items:center;font-size:26px;line-height:1;color:var(--ink)}
.circ.ghost{background:transparent}
.nav-t{font-size:17px;font-weight:600}
.thread{position:absolute;top:110px;left:16px;right:16px;bottom:110px;display:flex;flex-direction:column;gap:12px;overflow:hidden}
.kit .who{display:block;font-size:13px;font-weight:600;color:var(--ink-3);margin:0 0 4px 4px}
.kb{background:var(--surface);border:1px solid var(--line);border-radius:20px 20px 20px 6px;padding:10px 14px;font-size:16px;max-width:88%}
.me-photo{align-self:flex-end;width:150px;height:176px;position:relative}.me-photo .photo,.me-photo .cap{border-radius:17px 17px 4px 17px;overflow:hidden}
.me-photo .photo{background-size:200px 250px;background-position:center -61px}
.me-photo .cap{position:absolute;left:0;right:0;bottom:0;border-top-left-radius:0;border-top-right-radius:0;padding:6px 10px;font-size:12px;color:#fff;background:linear-gradient(transparent,rgba(14,17,28,.8))}
.ex{padding:14px 14px 10px;display:flex;flex-direction:column;gap:10px}
.ex .vd b{font-size:17px}
.callout{position:absolute;width:24px;height:24px;border-radius:50%;background:var(--accent);color:var(--on-primary);font-size:13px;font-weight:700;display:grid;place-items:center;box-shadow:0 0 0 3px var(--bg)}
.callout.c1{top:8px;left:-12px}.callout.c2{right:-4px;top:-6px}.callout.c3{right:-4px;top:-26px}.callout.c4{right:-4px}
.legend{display:flex;flex-direction:column;gap:4px;font-size:13.5px;color:var(--ink-2);padding:0 4px}
.legend p{margin:0}.legend b{color:var(--accent);margin-right:6px}
.dock{position:absolute;left:0;right:0;bottom:0;padding:14px 20px 34px;background:var(--bg);border-top:1px solid var(--line)}

/* B's one play: each piece rises in, in order. At rest (no .play) everything shows, and Reduce Motion never plays. */
@media (prefers-reduced-motion: no-preference){
  .play .anim.d1,.play .anim .d2,.play .anim .d3,.play .anim .d4,.play .anim .d5,.play .demo.anim{animation:rise .42s cubic-bezier(.2,.8,.2,1) both}
  .play .anim.d1{animation-delay:.2s}
  .play .demo.anim{animation-delay:.9s}
  .play .anim .d3{animation-delay:1.5s}
  .play .anim .d4{animation-delay:2.4s}
  .play .anim .d5{animation-delay:3.1s}
}
@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (max-width:760px){.mast,.dir-head,.pick{grid-template-columns:minmax(0,1fr)}.phone{zoom:.5}.story .phone{zoom:.36}}
'''


def html():
    b_story = "".join(phone("light", dirB("light", s), True, f"Direction B, frame {s}") for s in (1, 2, 3, 4))
    return f'''<title>Kitted Welcome Directions</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..800&display=swap">
<style>{CSS.replace('__PHOTO__', PHOTO)}</style>
<div class="board">
<header class="mast">
  <div><span class="eyebrow">Onboarding · the first screen · Nov 4, 2026</span><h1>Say what Kitted does before he taps anything.</h1></div>
  <p class="lede">Three ways for the start of onboarding to explain the app without adding steps before the first score. Every number and line on the example card is the engine's own result for the Welcome photo: <b>7.5 Put together</b>, one fix to <b>8.0</b>, 4 pieces added. Faces never show: the photo starts below the collar. All words here are drafts for you to approve.</p>
</header>

<div class="pick">
  <div class="rec"><h3>B · One screen that plays a check <small>Recommended</small></h3><p>Adds no taps. The screen shows the whole loop once (your photo, the score, the fix, the closet) in about 3 seconds, and the headline says it in words. Strongest evidence: Apple and NN/g both say show the real thing, skip the tutorial.</p></div>
  <div><h3>C · The example check first <small>+1 tap</small></h3><p>A real, labelled check as the main path. Clear, but every new user gets one more screen, and an example that he opens himself is the version that gets read.</p></div>
  <div><h3>A · Three cards <small>+2 taps</small></h3><p>The classic "how it works" swipe. The weakest evidence: people skip these, and in NN/g's test the people who read them did no better.</p></div>
</div>

<section class="dir" id="b">
  <div class="dir-head">
    <div><span class="eyebrow">Direction B · recommended</span><h2>One screen that plays one real check</h2>
      <div class="facts"><span class="fact good">+0 taps · 8 to the camera</span><span class="fact">plays once, about 3 s</span><span class="fact">Reduce Motion: the last frame, no movement</span></div></div>
    <div><p>Today's Welcome, made to explain itself. The small card on the photo becomes the whole loop: "Your fit pic" appears on the photo, the card reads it, the score lands (the same tape-lock reveal as a real check), the fix rises in with its "→ 8.0", and the closet line ticks in. It plays once on arrival, then rests on the full card. A tap anywhere skips it.</p>
    <p>The headline changes from the promise to the action ("Send a fit pic. Get a score and the one fix."), which is your own hook from the market research. The positioning line stays everywhere else (the App Store, videos). The body line carries the three trust points in one sentence.</p></div>
  </div>
  <div class="row"><div><p class="shot-label">The resting frame <span>(what every frame ends on)</span></p><div id="bplay">{pair(dirB_anim, True, "Direction B, Welcome")}</div><button class="replay" type="button" id="replay">Play it again</button></div></div>
  <p class="shot-label" style="margin-top:30px">The four beats <span>(light; dark is the same)</span></p>
  <div class="story">{b_story}</div>
  <div class="words"><h4>Words to approve</h4><ul>
    <li>Headline: <b>Send a fit pic. Get a score and the one fix.</b> <span>(was "Look put together. Without trying too hard."; keep the old one if you'd rather, the demo still explains)</span></li>
    <li>Body: <b>It rates the outfit, never you, and learns your closet as you go. Your daily check is free.</b> <span>(was "Send a fit. Get a score out of 10 and the two or three moves that raise it.")</span></li>
    <li>On the photo: <b>Your fit pic</b> · on the card: <b>Fit check · Full</b>, <b>Reading your fit</b>, <b>7.5 Put together · Everyday</b>, <b>Swap the chunky sneakers for low-profile sneakers → 8.0</b>, <b>Added 4 to your closet</b> <span>(the score and fix come from the engine, so they follow any scoring change)</span></li>
    <li>VoiceOver, once: <b>Example fit check. 7.5 out of 10, Put together. One fix: swap the chunky sneakers for low-profile sneakers, for 8.0. Added 4 pieces to the closet.</b></li>
    <li>Buttons unchanged: <b>Get started</b> · <b>See an example check</b> · (the sign-in session's <b>I already have an account</b>, dashed here)</li>
  </ul></div>
</section>

<section class="dir" id="c">
  <div class="dir-head">
    <div><span class="eyebrow">Direction C</span><h2>The example check becomes the main path</h2>
      <div class="facts"><span class="fact">+1 tap · 9 to the camera</span><span class="fact">no motion</span></div></div>
    <div><p>Welcome stays as it is, with plainer body words. Its main button now opens today's example check, with four numbered notes that say what each part is. "Check my own fit" moves on to setup. "Skip to setup" is there for anyone who already gets it.</p>
    <p>It's the most complete explanation, but it puts a reading screen in front of everyone, and the people who'd read it are the ones who'd tap "See an example check" today anyway.</p></div>
  </div>
  <div class="row">
    <div><p class="shot-label">Welcome</p>{pair(c1, True, "Direction C, Welcome")}</div>
    <div><p class="shot-label">How it works <span>(the example check, labelled)</span></p>{pair(c2, False, "Direction C, example")}</div>
  </div>
  <div class="words"><h4>Words to approve</h4><ul>
    <li>Body: <b>Send a fit pic. Get a score out of 10 and the one fix that raises it.</b></li>
    <li>Buttons: <b>See how it works</b> · <b>Skip to setup</b> · page title <b>How it works</b> · dock <b>Check my own fit</b></li>
    <li>Kit: <b>Here's a real check. This is what you'll get from your own photo.</b></li>
    <li>Notes: <b>1 Send a fit pic. Your face is blurred first.</b> · <b>2 A score out of 10. Same photo, same score.</b> · <b>3 The one fix, and what it gets you.</b> · <b>4 Your pieces go in your closet for outfit ideas.</b></li>
  </ul></div>
</section>

<section class="dir" id="a">
  <div class="dir-head">
    <div><span class="eyebrow">Direction A</span><h2>Three cards: snap, score, closet</h2>
      <div class="facts"><span class="fact">+2 taps · 10 to the camera</span><span class="fact">Skip on cards 1–2 (+1)</span></div></div>
    <div><p>A short swipe before setup: one card per step of the loop, each with a real piece of the app (the camera's frame, the score card, the closet tiles). Next and Skip on each. It's what most apps do, and it's the one the evidence is against: people swipe past, and those who read do no better.</p></div>
  </div>
  <div class="row">
    <div><p class="shot-label">1 · Snap</p>{pair(a1, False, "Direction A, card 1")}</div>
    <div><p class="shot-label">2 · Score</p>{pair(a2, False, "Direction A, card 2")}</div>
    <div><p class="shot-label">3 · Closet</p>{pair(a3, False, "Direction A, card 3")}</div>
  </div>
  <div class="words"><h4>Words to approve</h4><ul>
    <li><b>Snap your fit.</b> Prop your phone up or use a mirror. Your face is blurred before anything is sent.</li>
    <li><b>Get a score and the one fix.</b> Out of 10, with the one change that raises it. Same photo, same score.</li>
    <li><b>It learns your closet.</b> Every check adds your pieces, so outfit ideas come from clothes you already own.</li>
    <li>Buttons: <b>Next</b> · <b>Skip</b> · <b>Get started</b> · on the closet card <b>Added 4 from your first check</b></li>
  </ul></div>
</section>

<section class="dir" id="today">
  <div class="dir-head"><div><span class="eyebrow">For comparison</span><h2>Today's Welcome</h2></div>
  <div><p>It already does the hard part right: a real result as the hero, scored by the same code as his own check, and an example he can open. What it doesn't do is say the action plainly. The headline is a promise ("Look put together"), the body still says "two or three moves" (the card now shows one fix), and nothing says the closet or the free check.</p></div></div>
  <div class="row"><div>{pair(today, True, "Today's Welcome")}</div></div>
</section>

<section class="research">
  <div class="dir-head"><div><span class="eyebrow">Why B</span><h2>What the research says</h2></div><div></div></div>
  <ol>
    <li><b>Show the real thing; skip the tutorial.</b> Apple: "People tend to grasp and retain information better when they can actually perform the task … instead of just viewing instructional material", and onboarding should be "fast, fun, and optional". <span class="src"><a href="https://developer.apple.com/design/human-interface-guidelines/onboarding">Apple HIG, Onboarding</a></span></li>
    <li><b>Swipe tutorials don't help.</b> NN/g tested 70 people on 4 apps: those who read the intro cards succeeded 91% of the time, those who skipped 94%, and readers found the tasks harder. <span class="src"><a href="https://www.nngroup.com/articles/mobile-tutorials/">NN/g, Mobile Tutorials</a></span> Common "60–80% skip" figures have no source behind them, so we'd measure our own.</li>
    <li><b>Let people use it before asking.</b> Duolingo moved sign-up after the first lesson and got "a much better conversion rate" (the often-quoted +20% is second-hand). <span class="src"><a href="https://www.intercom.com/blog/?p=15014">Intercom, Duolingo</a></span></li>
    <li><b>Fewer steps finish more.</b> Web product tours: 1–2 steps finish 73% of the time, 3–5 steps 38% (vendor data, a different medium, so a direction only). <span class="src"><a href="https://produktly.com/research/saas-onboarding-benchmarks-2026">Produktly 2026</a></span> Tours people open themselves finish 69% vs 23% for ones that open on their own, which is why C's labelled example should stay something he chooses.</li>
    <li><b>Motion must be optional and never the only message.</b> Apple: "Make motion optional", don't use motion "as the only way to communicate important information". So B's headline says the whole thing in words, and under Reduce Motion it shows the last frame. <span class="src"><a href="https://developer.apple.com/design/human-interface-guidelines/motion">Apple HIG, Motion</a></span></li>
    <li><b>The rivals explain with words and charge before the result.</b> Looksee and DRPD lead with "score + one fix" too (so the loop isn't the difference); GRWM and Dressly run long quizzes and paywalls, and their reviews complain about it. Kitted's real difference on screen one is how fast and free the first score is.</li>
  </ol>
  <div class="cmp"><table><thead><tr><th>App</th><th>Subtitle</th><th>How it explains itself</th><th>Before the first result</th></tr></thead><tbody>
    <tr><td>Looksee</td><td>Personal Stylist &amp; Fit Advice</td><td>"An honest verdict on your outfit before you leave."</td><td>Score free; "the First Fix" and breakdown paid ($4.99/wk)</td></tr>
    <tr><td>DRPD</td><td>Honest Score &amp; Specific Fixes</td><td>"Your Drip Score in seconds… one Level-Up move, then rescan"</td><td>Score shown before the paywall (their claim); $3.99/wk</td></tr>
    <tr><td>GRWM</td><td>Get Ready With Me AI Helper</td><td>"1) Snap 2) Select what you're dressing for 3) Get ratings and tips"</td><td>Tips need a subscription; reviews mention a quiz before paying</td></tr>
    <tr><td>Dressly</td><td>Create Your Capsule Wardrobe</td><td>A general "AI-powered stylist" pitch</td><td>About 40 screens: quiz, "Building your plan", paywall, account</td></tr>
  </tbody></table></div>
</section>
</div>
<script>
(function(){{
  var box=document.getElementById('bplay'), btn=document.getElementById('replay');
  function play(){{ box.classList.remove('play'); void box.offsetWidth; box.classList.add('play'); }}
  btn.addEventListener('click', play);
  setTimeout(play, 500);
}})();
</script>
'''


OUT.write_text(html())
print("wrote", OUT)
