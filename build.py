#!/usr/bin/env python3
"""Build MCCPS site (mccps.fastapi.online): src/ + content/pages/*.json -> docs/ (GitHub Pages root).

Hand-written pages live in src/pages/ (HTML fragment; first line is a JSON meta comment).
The 200 SEO pages are data in content/pages/<slug>.json and are rendered by render_content().
`{{i:name}}` expands to an inline SVG icon from partials/icons.svg.
"""
import json, re, shutil, hashlib, datetime, html
from pathlib import Path
from email.utils import format_datetime

ROOT = Path(__file__).parent
SRC, OUT, CONTENT = ROOT / "src", ROOT / "docs", ROOT / "content"
SITE = "https://mccps.fastapi.online"
DOMAIN = "mccps.fastapi.online"
TODAY = datetime.date.today()
FIDELITY = "https://fidelity-funding.com"

CATS = {
    "industries": {"name": "Industries", "single": "Industry payments", "hub_title": "Payment Processing by Industry",
                   "hub_desc": "How card acceptance really works in 50 industries — the hardware, fees, risks and setups that fit how each business gets paid.", "icon": "building"},
    "solutions": {"name": "Solutions", "single": "Solution", "hub_title": "Payment Processing Solutions",
                  "hub_desc": "Every way to get paid — terminals, POS, online gateway, recurring billing, ACH, Level 2/3 and the Zero Processing Fees program — explained in plain English.", "icon": "card"},
    "use-cases": {"name": "How-To Guides", "single": "How-to", "hub_title": "Payments How-To Guides",
                  "hub_desc": "Step-by-step guides for the payment jobs owners actually face: lowering fees, taking payments anywhere, fighting chargebacks and switching processors.", "icon": "target"},
    "blog": {"name": "Blog", "single": "Guide", "hub_title": "The MCCPS Payments Blog",
             "hub_desc": "Straight answers on interchange, pricing models, statements, security, chargebacks and running a lower-cost, faster-paid business.", "icon": "book"},
}
TOPIC_RULES = [  # blog filter chips
    ("pricing", r"interchange|assessment|markup|effective|tiered|flat|pricing|dual|discount|surcharge|convenience|debit|rewards|fee|negotiat|small-ticket|large-ticket|international|tax"),
    ("security", r"pci|emv|contactless|wallet|token|p2pe|3d-secure|avs|security|breach|theft|fraud|card-testing"),
    ("chargebacks", r"chargeback|friendly|refund|reserve|hold|match"),
    ("basics", r"how-credit|merchant-account|iso|gateway|processor|statement|batch|next-day|ach|checks|cash-vs|cashless|startups|glossary|future"),
    ("hardware", r"terminal|pos|offline|receipt|tipping|qr|links|omnichannel|checkout|loyalty|gift|analytics|recurring|updater|holiday|seasonal|bnpl|buy-now"),
    ("agents", r"agent|residual|iso-vs|selling|sales-tool"),
]

def read(p): return (SRC / p).read_text(encoding="utf-8")
def esc(s): return html.escape(str(s), quote=True)
def icons(h):
    return re.sub(r"\{\{i:([a-z0-9-]+)\}\}", lambda m: f'<svg class="icon" aria-hidden="true"><use href="#i-{m.group(1)}"/></svg>', h)
def ic(n): return f'<svg class="icon" aria-hidden="true"><use href="#i-{n}"/></svg>'
def minify_css(s):
    s = re.sub(r"/\*.*?\*/", "", s, flags=re.S); s = re.sub(r"\s+", " ", s)
    s = re.sub(r"\s*([{};:,>])\s*", r"\1", s); return s.replace(";}", "}").strip()
def minify_js(s):
    return "\n".join(t for t in (l.strip() for l in s.splitlines()) if t and not t.startswith("//"))
def ld(obj): return '<script type="application/ld+json">' + json.dumps(obj, separators=(",", ":")).replace("</", "<\\/") + "</script>"
def words(p):
    t = " ".join(p.get("intro", [])) + " ".join(" ".join(s.get("paragraphs", []) + s.get("bullets", []) + s.get("steps", [])) for s in p.get("sections", []))
    t += " ".join(f["a"] for f in p.get("faq", []))
    return len(t.split())

def link_paypilot(t):
    return t.replace("Fidelity Funding", f'<a href="{FIDELITY}" target="_blank" rel="noopener">Fidelity Funding</a>', 1)
def para(t): return f"<p>{link_paypilot(esc(t))}</p>"

def crumbs_ld(items):
    return {"@context": "https://schema.org", "@type": "BreadcrumbList",
            "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": SITE + u} for i, (n, u) in enumerate(items)]}

def card(p, small=False):
    c = p["category"]; u = f"/{c}/{p['slug']}/"
    grads = {"industries": "linear-gradient(140deg,#1565C0,#0B2D5B)", "solutions": "linear-gradient(140deg,#2E9E4F,#0A2A4A)",
             "use-cases": "linear-gradient(140deg,#1E7DF0,#0A2342)", "blog": "linear-gradient(140deg,#0D47A1,#2E7D32)"}
    return (f'<a class="vcard" href="{u}" data-tags="{esc(p.get("_topics", c))}"><div class="vcard__thumb"><div class="vcard__art" style="background:{grads[c]}">'
            f'{ic(p.get("icon", "book"))}<strong>{esc(p["title"])}</strong></div><span class="vcard__badge">{p.get("read_minutes", 5)} min read</span><span class="vcard__bar"></span></div>'
            f'<div class="vcard__meta"><span class="vcard__ch"><img src="/assets/img/favicon-32.png" alt="" width="28" height="28" loading="lazy"></span><div>'
            f'<div class="vcard__title">{esc(p["title"])}</div><div class="vcard__sub">{CATS[c]["single"]} · MCCPS</div></div></div></a>')

def render_content(p, by_slug):
    c = p["category"]; cat = CATS[c]; url = f"/{c}/{p['slug']}/"
    toc, body = [], []
    for i, s in enumerate(p["sections"]):
        hid = re.sub(r"[^a-z0-9]+", "-", s["h2"].lower()).strip("-")[:60] or f"s{i}"
        toc.append((hid, s["h2"]))
        b = f'<h2 id="{hid}">{esc(s["h2"])}</h2>' + "".join(para(x) for x in s.get("paragraphs", []))
        if s.get("bullets"): b += "<ul>" + "".join(f"<li>{link_paypilot(esc(x))}</li>" for x in s["bullets"]) + "</ul>"
        if s.get("steps"): b += '<ol class="steps-list">' + "".join(f"<li>{link_paypilot(esc(x))}</li>" for x in s["steps"]) + "</ol>"
        body.append(b)
        if i == 1:  # mid-article conversion module
            body.append(f'''<aside class="inline-cta"><div><b>See exactly what you pay to accept cards</b><span>Free statement analysis · no obligation · keep your terminals where possible</span></div><a class="btn btn--primary" href="/free-analysis/?ref={esc(p['slug'])}">Get my free analysis {ic("arrow")}</a></aside>''')
    takeaways = "".join(f"<li>{ic('check')}<span>{esc(t)}</span></li>" for t in p.get("key_takeaways", []))
    faq = "".join(f'<details{" open" if k == 0 else ""}><summary>{esc(f["q"])}<span class="faq__pm" aria-hidden="true"></span></summary><div class="faq__a"><p>{link_paypilot(esc(f["a"]))}</p></div></details>' for k, f in enumerate(p.get("faq", [])))
    rel = [by_slug[s] for s in p.get("related", []) if s in by_slug and s != p["slug"]][:6]
    if len(rel) < 3:
        rel += [q for q in by_slug.values() if q["category"] == c and q["slug"] != p["slug"] and q not in rel][: 3 - len(rel)]
    toc_html = "".join(f'<a href="#{i}">{esc(h)}</a>' for i, h in toc)
    is_processing = "Fidelity Funding" in json.dumps(p)
    side_extra = (f'<a class="paypilot-mini" href="{FIDELITY}" target="_blank" rel="noopener"><span class="pp-badge">{ic("cash")}</span><span><b>Fidelity Funding</b><small>Working capital for merchants</small></span>{ic("arrow-up-right")}</a>' if is_processing else "")
    widget = ""
    if c == "industries":
        nm = esc(p["title"].replace(" Payment Processing", "").replace(" Processing", ""))
        widget = f'''<section class="estimator reveal" aria-labelledby="est-t"><div><span class="eyebrow">Quick estimate</span><h2 id="est-t" class="h3" style="margin-top:8px">What {nm} businesses pay to accept cards</h2><p class="muted">Slide to your monthly card sales to see what a typical effective rate costs per year — then get your real numbers from a free statement analysis.</p></div>
<div class="est-box" data-savings><label class="sr-only" for="est-rev">Monthly card volume</label><div class="est-row"><span>Monthly card volume</span><b data-est-rev>$40,000</b></div><input id="est-rev" type="range" min="5000" max="500000" step="5000" value="40000"><div class="est-out"><span>Per year at 3.2%*</span><b data-est-out>$15,360</b></div>
<a class="btn btn--primary" data-est-go href="/free-analysis/?industry={esc(p["slug"])}">See my real numbers {ic("arrow")}</a><small class="muted">*Illustrative only. Effective rates vary with card mix, ticket size and how you accept cards; your free analysis shows your actual cost.</small></div></section>'''
    head = (ld(crumbs_ld([("Home", "/"), (cat["name"], f"/{c}/"), (p["title"], url)]))
            + (ld({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": f["q"], "acceptedAnswer": {"@type": "Answer", "text": f["a"]}} for f in p.get("faq", [])]}) if p.get("faq") else "")
            + ld({"@context": "https://schema.org", "@type": "Article" if c == "blog" else "WebPage", "headline": p["title"], "description": p["meta_description"],
                  "url": SITE + url, "datePublished": TODAY.isoformat(), "dateModified": TODAY.isoformat(), "inLanguage": "en-US",
                  "image": SITE + f"/assets/img/og-{c}.jpg", "keywords": ", ".join(p.get("keywords", [])),
                  "author": {"@type": "Organization", "name": "MCCPS Editorial Team", "url": SITE + "/about/"},
                  "publisher": {"@type": "Organization", "name": "MCCPS — Merchant Credit Card Processing Services", "logo": {"@type": "ImageObject", "url": SITE + "/assets/img/logo.png"}}}))
    intro = "".join(para(x) for x in p.get("intro", []))
    page = f'''<article class="content-page">
<header class="article-hero">
  <div class="container">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/{c}/">{cat["name"]}</a><span>/</span><span aria-current="page">{esc(p["title"])}</span></nav>
    <span class="eyebrow" style="margin-top:22px">{esc(p.get("eyebrow", cat["single"]))}</span>
    <h1 class="h1">{esc(p["title"])}</h1>
    <p class="lead" style="margin-top:18px;max-width:780px">{esc(p.get("dek", ""))}</p>
    <div class="article-meta"><span class="vcard__ch"><img src="/assets/img/favicon-32.png" alt="" width="28" height="28"></span><b style="color:var(--ink)">MCCPS Editorial Team</b><span>Updated {TODAY.strftime("%b %-d, %Y")}</span><span>· {p.get("read_minutes", 6)} min read</span>
      <button class="share-btn" type="button" data-share>{ic("send")} Share</button></div>
  </div>
</header>
<div class="container article-wrap">
  <div class="prose">
    {intro}
    {"<div class='takeaways'><h2 class='h3'>Key takeaways</h2><ul>" + takeaways + "</ul></div>" if takeaways else ""}
    {"".join(body)}
    {widget}
    <section class="faq faq--inline" aria-labelledby="faq-t"><h2 id="faq-t">Frequently asked questions</h2>{faq}</section>
    <div class="tags">{"".join(f"<span>#{esc(k)}</span>" for k in p.get("keywords", [])[:6])}</div>
    <p class="disclaimer-light">This article is general information, not legal, tax or compliance advice. Card-network and state rules change — confirm current requirements before acting. Savings depend on your individual statement analysis.</p>
  </div>
  <aside class="article-aside"><div class="aside-sticky">
    <div class="side-card">
      <h3>Stop overpaying for cards.</h3>
      <p>Send two statements. We’ll show you line by line where the money goes — free, no obligation.</p>
      <a class="btn btn--white" href="/free-analysis/?ref={esc(p['slug'])}">Free analysis {ic("arrow")}</a>
      <a class="btn btn--ghost-dark" href="tel:+18448266227" style="width:100%;margin-top:10px">{ic("phone")} 844.826.6227</a>
    </div>
    {side_extra}
    <nav class="toc" aria-label="On this page"><h4>On this page</h4>{toc_html}<a href="#faq-t">FAQ</a></nav>
  </div></aside>
</div>
</article>
<section class="section section--tight section--soft"><div class="container"><div class="row__head"><h2 class="h3">Keep exploring</h2><a class="link-arrow" href="/{c}/">All {cat["name"].lower()} {ic("arrow")}</a></div><div class="vgrid">{"".join(card(r) for r in rel)}</div></div></section>
'''
    meta = {"title": p["seo_title"], "desc": p["meta_description"], "nav": c, "light": True, "image": f"/assets/img/og-{c}.jpg"}
    return meta, page, head

def render_hub(c, pages):
    cat = CATS[c]; url = f"/{c}/"
    chips = ""
    if c == "blog":
        chips = ('<div class="filters" role="group" aria-label="Filter by topic"><button class="fchip" data-filter="all" aria-pressed="true">All</button>'
                 + "".join(f'<button class="fchip" data-filter="{k}" aria-pressed="false">{n}</button>' for k, n in
                           [("pricing", "Pricing & fees"), ("basics", "Payments basics"), ("security", "Security & fraud"), ("chargebacks", "Chargebacks"), ("hardware", "POS & features"), ("agents", "For agents")]) + "</div>")
    grid = "".join(card(p) for p in pages)
    body = f'''<section class="page-hero">
  <div class="hero__bg" aria-hidden="true"><div class="aurora"><i></i><i></i><i></i><i></i></div><div class="hero__grid"></div></div>
  <div class="container">
    <nav class="crumbs fade-up" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span>{cat["name"]}</span></nav>
    <h1 class="h1 fade-up d1">{cat["hub_title"]}</h1>
    <p class="lead fade-up d2">{cat["hub_desc"]}</p>
    <p class="hub-count fade-up d3"><b>{len(pages)}</b> in-depth {"guides" if c == "blog" else "pages"} · updated {TODAY.strftime("%B %Y")}</p>
  </div>
</section>
<section class="section section--tight">
  <div class="container">
    <div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;align-items:center;margin-bottom:36px">
      {chips or '<span></span>'}
      <label class="search">{ic("search")}<span class="sr-only">Search</span><input type="search" placeholder="Search {cat["name"].lower()}" data-filter-search></label>
    </div>
    <div class="vgrid" data-filter-grid data-paginate="24">{grid}</div>
    <div style="text-align:center;margin-top:40px"><button class="btn btn--ghost btn--lg" type="button" data-more hidden>Load more</button></div>
    <p class="empty" data-empty hidden>Nothing matches that yet. <button class="link-arrow" type="button" data-ai-open>Ask MCCPS AI instead {ic("sparkles")}</button></p>
  </div>
</section>
{read("partials/cta-band.html")}'''
    head = ld(crumbs_ld([("Home", "/"), (cat["name"], url)])) + ld({"@context": "https://schema.org", "@type": "CollectionPage", "name": cat["hub_title"], "url": SITE + url, "description": cat["hub_desc"],
        "mainEntity": {"@type": "ItemList", "numberOfItems": len(pages), "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": SITE + f"/{c}/{p['slug']}/"} for i, p in enumerate(pages)]}})
    return {"title": f"{cat['hub_title']} | MCCPS", "desc": cat["hub_desc"], "nav": c, "image": f"/assets/img/og-{c}.jpg"}, body, head

def main():
    if OUT.exists(): shutil.rmtree(OUT)
    (OUT / "assets").mkdir(parents=True)
    shutil.copytree(SRC / "assets" / "img", OUT / "assets" / "img")
    shutil.copytree(SRC / "assets" / "fonts", OUT / "assets" / "fonts")
    shutil.copytree(SRC / "assets" / "vendor", OUT / "assets" / "vendor")
    css = minify_css(read("assets/css/site.css") + read("assets/css/v2.css") + read("assets/css/mccps.css"))
    js = {n: minify_js(read(f"assets/js/{n}")) for n in ("site.js", "assistant.js", "analysis.js", "tools.js")}
    ver = hashlib.sha1((css + "".join(js.values())).encode()).hexdigest()[:8]
    (OUT / "assets/site.css").write_text(css)
    for n, s in js.items(): (OUT / "assets" / n).write_text(s)
    (OUT / "assets/hero-card.js").write_text(read("assets/js/hero-card.js"))
    (OUT / "sw.js").write_text(read("assets/js/sw.js").replace("{{ver}}", ver))

    head_t, nav, foot, assistant, sprite = (read(f"partials/{n}") for n in ("head.html", "nav.html", "footer.html", "assistant.html", "icons.svg"))

    # ---- content ----
    manifest = json.load(open(CONTENT / "manifest.json"))
    by_slug, missing = {}, []
    for m in manifest:
        f = CONTENT / "pages" / f"{m['slug']}.json"
        if not f.exists(): missing.append(m["slug"]); continue
        p = json.load(open(f)); p["category"] = m["category"]; p["slug"] = m["slug"]
        p.setdefault("seo_title", m["title"] + " | Fidelity Funding"); p.setdefault("meta_description", p.get("dek", m["title"]))
        if m["category"] == "blog":
            p["_topics"] = " ".join(k for k, rx in TOPIC_RULES if re.search(rx, m["slug"])) or "basics"
        by_slug[m["slug"]] = p
    if missing: print(f"WARNING: {len(missing)} content pages missing: {' '.join(missing[:12])}{' …' if len(missing) > 12 else ''}")

    pages = []  # (route, meta, body, extra_head)
    for raw_path in sorted((SRC / "pages").rglob("*.html")):
        raw = raw_path.read_text(encoding="utf-8")
        mm = re.match(r"<!--(\{.*?\})-->\s*", raw, re.S); meta = json.loads(mm.group(1)); body = raw[mm.end():]
        rel = raw_path.relative_to(SRC / "pages").as_posix()
        route = "/" if rel == "index.html" else None if rel == "404.html" else "/" + rel.removesuffix(".html").removesuffix("/index") + "/"
        pages.append((route, meta, body, meta.get("ld", "") + meta.get("head", "")))
    # glossary
    gl = json.load(open(CONTENT / "glossary.json")); letters = sorted({g["term"][0].upper() for g in gl})
    gbody = (f'<section class="page-hero"><div class="hero__bg" aria-hidden="true"><div class="aurora"><i></i><i></i><i></i><i></i></div><div class="hero__grid"></div></div><div class="container"><nav class="crumbs fade-up" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span>Glossary</span></nav><h1 class="h1 fade-up d1">Payments glossary</h1><p class="lead fade-up d2">{len(gl)} payment-processing terms you’ll see on statements, contracts and terminals — explained in plain English.</p></div></section>'
             f'<section class="section section--tight"><div class="container" style="max-width:900px"><nav class="glossary-nav" aria-label="Jump to letter">' + "".join(f'<a href="#g-{l}">{l}</a>' for l in letters) + '</nav><dl>')
    cur = ""
    for g in gl:
        L = g["term"][0].upper()
        if L != cur: gbody += f'<div class="gletter" id="g-{L}">{L}</div>'; cur = L
        gbody += f'<div class="gterm" id="{re.sub(r"[^a-z0-9]+", "-", g["term"].lower()).strip("-")}"><dt>{esc(g["term"])}</dt><dd>{esc(g["def"])} <a href="{g["url"]}">Learn more →</a></dd></div>'
    gbody += '</dl></div></section>{{cta-band}}'
    gld = ld({"@context": "https://schema.org", "@type": "DefinedTermSet", "name": "Payment processing glossary", "url": SITE + "/glossary/",
              "hasDefinedTerm": [{"@type": "DefinedTerm", "name": g["term"], "description": g["def"]} for g in gl]}) + ld(crumbs_ld([("Home", "/"), ("Glossary", "/glossary/")]))
    pages.append(("/glossary/", {"title": "Payment Processing Glossary — 50+ Terms | MCCPS", "desc": "Interchange, assessments, batch, chargeback, EMV, tokenization, Level 3 and more: a plain-English glossary of credit card processing terms.", "nav": "tools"}, gbody, gld))
    for c in CATS:
        cp = [p for p in by_slug.values() if p["category"] == c]
        if not cp: continue
        meta, body, h = render_hub(c, cp); pages.append((f"/{c}/", meta, body, h))
        for p in cp:
            meta, body, h = render_content(p, by_slug); pages.append((f"/{c}/{p['slug']}/", meta, body, h))

    # dynamic blocks for hand-written pages
    def pick(c, n): return [p for p in by_slug.values() if p["category"] == c][:n]
    blocks = {
        "{{cards:blog}}": "".join(card(p) for p in pick("blog", 8)),
        "{{cards:industries}}": "".join(card(p) for p in pick("industries", 8)),
        "{{links:industries}}": "".join(f'<a href="/industries/{p["slug"]}/">{esc(p["title"].replace(" Payment Processing", "").replace(" Processing", ""))}</a>' for p in by_slug.values() if p["category"] == "industries"),
        "{{links:solutions}}": "".join(f'<a href="/solutions/{p["slug"]}/">{esc(p["title"])}</a>' for p in by_slug.values() if p["category"] == "solutions"),
        "{{links:use-cases}}": "".join(f'<a href="/use-cases/{p["slug"]}/">{esc(p["title"])}</a>' for p in by_slug.values() if p["category"] == "use-cases"),
        "{{count:all}}": str(len(by_slug)),
        "{{cta-band}}": read("partials/cta-band.html"),
    }
    for c in CATS: blocks[f"{{{{count:{c}}}}}"] = str(sum(1 for p in by_slug.values() if p["category"] == c))

    org_ld = ld({"@context": "https://schema.org", "@type": "Organization", "@id": SITE + "/#org", "name": "MCCPS — Merchant Credit Card Processing Services", "alternateName": "MCCPS",
                 "url": SITE + "/", "logo": SITE + "/assets/img/logo.png", "image": SITE + "/assets/img/og.jpg", "sameAs": ["https://www.mccp.services/"],
                 "contactPoint": {"@type": "ContactPoint", "telephone": "+1-844-826-6227", "contactType": "customer service", "availableLanguage": "English", "hoursAvailable": "Mo-Su 00:00-23:59"}})
    site_ld = ld({"@context": "https://schema.org", "@type": "WebSite", "name": "MCCPS", "url": SITE + "/",
                  "potentialAction": {"@type": "SearchAction", "target": SITE + "/search/?q={query}", "query-input": "required name=query"}})

    urls = []
    for route, meta, body, extra in pages:
        dest = OUT / ("404.html" if route is None else ("index.html" if route == "/" else route.strip("/") + "/index.html"))
        dest.parent.mkdir(parents=True, exist_ok=True)
        navh = nav
        for key in ("home", "analysis", "blog", "industries", "solutions", "use-cases", "tools", "agents", "contact", "pricing"):
            navh = navh.replace(f'data-nav="{key}"', f'data-nav="{key}"' + (' aria-current="page"' if meta.get("nav") == key else ""))
        if meta.get("light"): navh = navh.replace('class="nav"', 'class="nav nav--light"', 1)
        for k, v in blocks.items(): body = body.replace(k, v)
        if 'class="faq' in body and '"FAQPage"' not in extra:
            qa = re.findall(r"<summary>(.*?)<span class=\"faq__pm\".*?<div class=\"faq__a\"><p>(.*?)</p>", body, re.S)
            if qa:
                strip = lambda x: html.unescape(re.sub(r"<[^>]+>", "", x)).strip()
                extra += ld({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": strip(q), "acceptedAnswer": {"@type": "Answer", "text": strip(a)}} for q, a in qa]})
        h = (head_t.replace("{{title}}", esc(meta["title"])).replace("{{desc}}", esc(meta.get("desc", "")))
             .replace("{{canonical}}", SITE + (route or "/")).replace("{{og_image}}", SITE + meta.get("image", "/assets/img/og.jpg"))
             .replace("{{ver}}", ver).replace("{{robots}}", "noindex" if (route is None or meta.get("noindex")) else "index,follow,max-image-preview:large")
             .replace("{{extra_head}}", (org_ld + site_ld if route == "/" else "") + extra))
        scripts = f'<script src="/assets/site.js?v={ver}" defer></script><script src="/assets/assistant.js?v={ver}" defer></script>'
        for s in meta.get("scripts", []): scripts += f'<script src="/assets/{s}?v={ver}" defer></script>'
        out = (h + '<body class="no-js">' + sprite + '<a class="skip" href="#main">Skip to content</a>' + navh
               + f'<main id="main">{body}</main>' + foot + assistant + scripts + "</body></html>")
        for k, v in blocks.items(): out = out.replace(k, v)
        out = icons(out).replace("{{year}}", str(TODAY.year))
        dest.write_text(out, encoding="utf-8")
        if route: urls.append((route, meta))

    # ---- search index (cmd-K + assistant) ----
    idx = [{"t": m["title"].split(" | ")[0], "u": r, "d": m.get("desc", "")[:150], "c": (r.strip("/").split("/")[0] or "home")} for r, m in urls]
    for p in by_slug.values():
        for e in idx:
            if e["u"] == f"/{p['category']}/{p['slug']}/": e["k"] = " ".join(p.get("keywords", []))[:200]; e["t"] = p["title"]
    (OUT / "search-index.json").write_text(json.dumps(idx, separators=(",", ":")))

    # ---- sitemaps ----
    def smap(name, rs):
        (OUT / name).write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + "".join(f"<url><loc>{SITE}{r}</loc><lastmod>{TODAY.isoformat()}</lastmod></url>\n" for r in rs if r not in ("/offline/", "/search/")) + "</urlset>\n")
    groups = {"sitemap-main.xml": [r for r, _ in urls if r.strip("/").split("/")[0] not in CATS or r.count("/") == 2]}
    for c in CATS: groups[f"sitemap-{c}.xml"] = [r for r, _ in urls if r.startswith(f"/{c}/") and r.count("/") > 2]
    for n, rs in groups.items(): smap(n, rs)
    (OUT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "".join(f"<sitemap><loc>{SITE}/{n}</loc><lastmod>{TODAY.isoformat()}</lastmod></sitemap>\n" for n in groups) + "</sitemapindex>\n")
    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nDisallow: /search/\n\nSitemap: {SITE}/sitemap.xml\n")

    # ---- RSS ----
    now = format_datetime(datetime.datetime.combine(TODAY, datetime.time(9), tzinfo=datetime.timezone.utc))
    items = "".join(f"<item><title>{esc(p['title'])}</title><link>{SITE}/blog/{p['slug']}/</link><guid>{SITE}/blog/{p['slug']}/</guid><pubDate>{now}</pubDate><description>{esc(p['meta_description'])}</description></item>"
                    for p in by_slug.values() if p["category"] == "blog")
    (OUT / "blog").mkdir(exist_ok=True)
    (OUT / "blog/feed.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>MCCPS Payments Blog</title><link>{SITE}/blog/</link><description>{CATS["blog"]["hub_desc"]}</description><language>en-us</language>{items}</channel></rss>')

    # ---- llms.txt ----
    lines = [f"# MCCPS — Merchant Credit Card Processing Services", "", "> US merchant services company: credit/debit card processing in store, online, by phone and mobile via the PayPilot by MCCPS platform; free statement analysis; Zero Processing Fees (compliant dual pricing) program; next-day funding; PCI help; 24/7 support at 844.826.6227. Independent sales agent program.", "", "## Key pages",
             f"- [Free analysis]({SITE}/free-analysis/)", f"- [Savings calculator]({SITE}/tools/savings-calculator/)", f"- [Agents]({SITE}/agents/)", f"- [Glossary]({SITE}/glossary/)", f"- [Contact]({SITE}/contact/)", ""]
    for c in CATS:
        lines += [f"## {CATS[c]['name']}"] + [f"- [{p['title']}]({SITE}/{c}/{p['slug']}/): {p['meta_description']}" for p in by_slug.values() if p["category"] == c] + [""]
    (OUT / "llms.txt").write_text("\n".join(lines))

    (OUT / "CNAME").write_text(DOMAIN + "\n"); (OUT / ".nojekyll").write_text("")
    (OUT / "manifest.webmanifest").write_text(json.dumps({"name": "MCCPS — Merchant Credit Card Processing Services", "short_name": "MCCPS", "start_url": "/", "display": "standalone",
        "background_color": "#FFFFFF", "theme_color": "#1565C0", "icons": [{"src": "/assets/img/icon-192.png", "sizes": "192x192", "type": "image/png"},
        {"src": "/assets/img/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"}]}))
    wc = [words(p) for p in by_slug.values()]
    print(f"built {len(urls)} pages ({len(by_slug)} content pages, words min {min(wc) if wc else 0} avg {sum(wc)//max(1,len(wc))}) -> docs (v{ver})")

if __name__ == "__main__":
    main()
