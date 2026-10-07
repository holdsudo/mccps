#!/usr/bin/env python3
"""One-off: render the scraped Privacy Policy and Terms text as page fragments (content verbatim)."""
import html, json, re
from pathlib import Path
R = Path(__file__).resolve().parent.parent
T = R / "_orig/pages/txt"

def emails(text, seq):
    it = iter(seq)
    return re.sub(r"\[email\s+protected\]", lambda m: next(it), text)

def link_emails(s):
    return re.sub(r"([\w.]+@[\w.-]+\.\w+)", r'<a href="mailto:\1" style="color:var(--blue)">\1</a>', s)

def render(lines, h2s, h3s, intro_skip=0):
    out, ul = [], []
    def flush():
        nonlocal ul
        if ul: out.append("<ul>" + "".join(f"<li>{x}</li>" for x in ul) + "</ul>"); ul = []
    for raw in lines:
        l = raw.strip()
        if not l: continue
        esc = link_emails(html.escape(l, quote=False))
        if l in h2s: flush(); out.append(f"<h2>{esc}</h2>")
        elif l in h3s: flush(); out.append(f"<h3>{esc}</h3>")
        elif l.startswith("- "): ul.append(link_emails(html.escape(l[2:], quote=False)))
        elif listy(l): ul.append(esc)
        else: flush(); out.append(f"<p>{esc}</p>")
    flush()
    return "\n".join(out)

LIST_CTX = set()
def listy(l): return l in LIST_CTX

def hero(title, sub):
    return f'''<section class="page-hero" style="padding-bottom:clamp(48px,7vw,80px)">
  <div class="hero__bg" aria-hidden="true"><div class="aurora"><i></i><i></i><i></i><i></i></div><div class="hero__grid"></div></div>
  <div class="container"><nav class="crumbs fade-up" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span>{title}</span></nav>
  <h1 class="h1 fade-up d1">{title}</h1><p class="lead fade-up d2">{sub}</p></div></section>'''

# ---- Privacy ----
txt = (T / "privacy-policy.txt").read_text()
txt = emails(txt, ["optout@Fidelity-Funding.com", "marketing@Fidelity-Funding.com", "operations@fidelity-funding.com", "marketing@Fidelity-Funding.com", "optout@Fidelity-Funding.com", "marketing@Fidelity-Funding.com", "optout@Fidelity-Funding.com", "info@Fidelity-Funding.com", "operations@fidelity-funding.com"])
lines = txt.splitlines()
start = lines.index("Overview"); end = lines.index("Contact Us")
body = lines[start:end]
h2 = {"Overview", "Part 1: Fidelity Funding U.S. Privacy Policy", "Part 2: California Supplement (CCPA Policy)"}
h3 = {"Information We Collect", "Use of Information", "Privacy and Sharing of Information", "User Access and Choice", "Opt-Out Policy",
      "Tracking Technologies / Cookies", "Log Files & Behavioral Advertising", "Security of Information", "Additional Information",
      "Changes to This Policy", "Contact Information", "Sharing Personal Information", "Your Rights and Choices ( California Residents )",
      "How to Submit a Request", "Changes to CCPA Privacy Notice", "End of Policy"}
# bullet lists = runs following a line ending with ':' until next heading / non-short line
in_list = False
for i, l in enumerate(body):
    if l in h2 or l in h3: in_list = False; continue
    if in_list and len(l) < 200 and not l.endswith(":"): LIST_CTX.add(l)
    else: in_list = False
    if l.endswith(":") and l not in ("General Queries:", "Mailing Address:", "Opt-Out Requests:"): in_list = True
for keep in ["* When required in the U.S., we collect beneficial ownership data solely to verify identity, as mandated by federal regulation.",
             "Sources include direct applications, client interactions, website activity, and third-party partners.",
             "Non-Discrimination: We will not deny services or alter pricing for exercising your rights.",
             "We may also collect information via site visits, credit agencies, vendors, and social media. Once you are a Fidelity Funding customer, we may reach out for updates.",
             ]:
    LIST_CTX.discard(keep)
LIST_CTX -= {l for l in LIST_CTX if l.startswith("We may also collect")}
priv = render(body, h2, h3)
priv = priv.replace("<h3>End of Policy</h3>", '<p style="margin-top:40px;color:var(--muted)"><em>End of Policy</em></p>')
(R / "src/pages/privacy-policy.html").write_text(
    '<!--' + json.dumps({"title": "Privacy Policy — Fidelity Funding", "desc": "How Fidelity Funding collects, uses, shares and protects your information, including our California (CCPA) supplement.", "nav": ""}) + '-->\n'
    + hero("Privacy Policy", "How we collect, use, and protect your information.") + f'\n<div class="container"><div class="legal">{priv}</div></div>\n')

# ---- Terms ----
LIST_CTX.clear()
txt = emails((T / "terms-and-conditions.txt").read_text(), ["josephm@fidelity-funding.com", "operations@fidelity-funding.com"])
lines = txt.splitlines()
start = lines.index("By using our website and services, including text messaging, you agree to these terms."); end = lines.index("Contact Us")
# rejoin hard-wrapped lines
paras, cur = [], ""
for l in lines[start:end]:
    if re.match(r"^\d+\. ", l) or l.startswith("- ") or not cur: 
        if cur: paras.append(cur)
        cur = l
    elif re.match(r"^\d+\. ", cur):
        paras.append(cur); cur = l
    else: cur += " " + l
paras.append(cur)
h2t = {p for p in paras if re.match(r"^\d+\. [A-Z][\w ]+$", p)}
terms = render(paras, h2t, set())
terms = re.sub(r"<li>([^:<]{3,40}):", r"<li><strong>\1:</strong>", terms)
(R / "src/pages/terms-and-conditions.html").write_text(
    '<!--' + json.dumps({"title": "Terms & Conditions — Fidelity Funding", "desc": "The terms that govern your use of the Fidelity Funding website and services, including text messaging.", "nav": ""}) + '-->\n'
    + hero("Terms &amp; Conditions", "By using our website and services, including text messaging, you agree to these terms.") + f'\n<div class="container"><div class="legal">{terms}</div></div>\n')
print("ok")
