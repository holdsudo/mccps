#!/usr/bin/env python3
"""One-off: turn the scraped article text (_orig/pages/txt) into insight page fragments."""
import re, html, json
from pathlib import Path
R = Path(__file__).resolve().parent.parent
TXT = R / "_orig/pages/txt"
OUT = R / "src/pages/insights"
POSTS = [
  ("trucking-company-mca-2026", "Apr 14, 2026", ["trucking", "mca"], "truck", "linear-gradient(140deg,#0329D1,#050A2A)", "/assets/img/post-trucking.webp"),
  ("merchant-cash-advance-retail-shop-stabilize-cash-flow", "Nov 26, 2025", ["retail", "mca"], "store", "linear-gradient(140deg,#5B3BFF,#0B0E4A)", None),
  ("restaurant-owner-improve-approval-odds-merchant-cash-advance", "Nov 26, 2025", ["restaurants", "mca"], "utensils", "linear-gradient(140deg,#0A8FB0,#071B4E)", None),
  ("trucking-company-merchant-cash-advance-approval-odds", "Nov 26, 2025", ["trucking", "mca"], "truck", "linear-gradient(140deg,#1E43FF,#0A2F9B)", None),
]
def inline(s):
    s = html.escape(s, quote=False)
    s = re.sub(r"^([A-Z][^:]{2,60}):\s", r"<strong>\1:</strong> ", s)
    s = s.replace("👉 Apply here: https://apply.fidelity-funding.com/", '👉 <a href="/apply/">Apply here</a>')
    s = re.sub(r"Apply here to explore your funding options\.", '<a href="/apply/">Apply here</a> to explore your funding options.', s)
    return s
meta_out = []
pages = {}
for slug, date, tags, icon, grad, cover in POSTS:
    lines = (TXT / f"{slug}.txt").read_text().splitlines()
    title = lines[0].lstrip("# ").strip()
    body = lines[3:]
    # drop trailing tag line + chrome
    end = next(i for i, l in enumerate(body) if l.strip() in ("Fidelity Funding", "Back to top"))
    tagline = body[end - 1] if not body[end-1].startswith(("#", "-")) and " " not in body[end-1][:40] or len(body[end-1]) > 60 and body[end-1].count(" ") < 6 else ""
    body = body[:end - 1] if tagline else body[:end]
    parts, toc, ul, first_p = [], [], [], None
    def flush():
        global ul
        if ul: parts.append("<ul>" + "".join(f"<li>{inline(x)}</li>" for x in ul) + "</ul>"); ul = []
    for l in body:
        l = l.strip()
        if not l or l == "#" or l.startswith("trucking business fundingmerchant"): continue
        if l.startswith("# "):
            flush(); h = l[2:].strip(); hid = re.sub(r"[^a-z0-9]+", "-", h.lower()).strip("-")
            toc.append((hid, h)); parts.append(f'<h2 id="{hid}">{html.escape(h)}</h2>')
        elif l.startswith("- "): ul.append(l[2:])
        else:
            flush()
            if first_p is None: first_p = l
            short = len(l) < 70 and not l.endswith(":") and l.endswith(".")
            parts.append(f'<p{" class=\"pull\"" if short and len(parts) > 2 and parts[-1].startswith("<ul") else ""}>{inline(l)}</p>')
    flush()
    desc = (first_p or title)[:155]
    words = sum(len(re.sub("<[^>]+>", "", p).split()) for p in parts)
    mins = 3  # matches the original site
    cover_html = (f'<img src="{cover}" alt="" width="1400" height="788">' if cover else
                  f'<div class="vcard__art" style="background:{grad};padding:clamp(20px,4vw,48px)"><svg class="icon" aria-hidden="true" style="width:clamp(64px,10vw,140px);height:auto"><use href="#i-{icon}"/></svg></div>')
    toc_html = "".join(f'<a href="#{i}">{html.escape(h)}</a>' for i, h in toc)
    page = f'''<!--{json.dumps({"title": title + " — Fidelity Funding Insights", "desc": desc, "nav": "insights", "light": True, **({"image": cover.replace(".webp", ".jpg")} if False else {})})}-->
<article>
  <header class="article-hero">
    <div class="container">
      <nav class="crumbs" aria-label="Breadcrumb" style="color:var(--muted)"><a href="/insights/">Insights</a><span>/</span><span>Industry-Specific Funding Guides</span></nav>
      <h1 class="h1">{html.escape(title)}</h1>
      <div class="article-meta"><span class="vcard__ch"><img src="/assets/img/favicon-32.png" alt="" width="28" height="28"></span><b style="color:var(--ink)">Fidelity Funding</b><span>{date}</span><span>· {mins} min read</span></div>
      <div class="article-cover">{cover_html}</div>
    </div>
  </header>
  <div class="container article-wrap">
    <div class="prose">
      {"".join(parts)}
      <div class="tags">{"".join(f"<span>#{t}</span>" for t in tags)}</div>
    </div>
    <aside class="article-aside">
      <div class="side-card">
        <h3>Ready when you are.</h3>
        <p>See your funding options in minutes — soft pull only, no obligation.</p>
        <a class="btn btn--white" href="/apply/">Get Funded {{{{i:arrow}}}}</a>
        <button class="btn btn--ghost-dark" type="button" data-ai-open="Ask about {html.escape(tags[0])} funding" style="width:100%;margin-top:10px">{{{{i:sparkles}}}} Ask Fidelity AI</button>
      </div>
      <nav class="toc" aria-label="On this page"><h4>On this page</h4>{toc_html}</nav>
    </aside>
  </div>
</article>
<section class="section section--tight section--soft"><div class="container"><div class="row__head"><h2 class="h3">Keep reading</h2><a class="link-arrow" href="/insights/">All insights {{{{i:arrow}}}}</a></div><div class="vgrid" data-related="{slug}"></div></div></section>
'''
    pages[slug] = page
    meta_out.append({"slug": slug, "title": title, "date": date, "tags": tags, "icon": icon, "grad": grad, "cover": cover, "desc": desc, "mins": mins})
def card(m):
    th = (f'<img src="{m["cover"]}" alt="" loading="lazy" width="1400" height="788">' if m["cover"] else
          f'<div class="vcard__art" style="background:{m["grad"]}"><svg class="icon" aria-hidden="true"><use href="#i-{m["icon"]}"/></svg><strong>{html.escape(m["title"][:60])}</strong></div>')
    return (f'<a class="vcard" href="/insights/{m["slug"]}/" data-tags="{" ".join(m["tags"])}"><div class="vcard__thumb">{th}<span class="vcard__badge">{m["mins"]} min read</span><span class="vcard__bar"></span></div>'
            f'<div class="vcard__meta"><span class="vcard__ch"><img src="/assets/img/favicon-32.png" alt="" width="28" height="28"></span><div><div class="vcard__title">{html.escape(m["title"])}</div><div class="vcard__sub">Fidelity Funding · {m["date"]}</div></div></div></a>')
for m in meta_out:
    rel = "".join(card(o) for o in meta_out if o["slug"] != m["slug"])
    (OUT / f'{m["slug"]}.html').write_text(pages[m["slug"]].replace(f'<div class="vgrid" data-related="{m["slug"]}"></div>', f'<div class="vgrid">{rel}</div>'))
(R / "tools/cards.html").write_text("\n".join(card(m) for m in meta_out))
(R / "tools/posts.json").write_text(json.dumps(meta_out, indent=1))
print("\n".join(f'{m["slug"]} {m["mins"]}min' for m in meta_out))
