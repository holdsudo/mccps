# MCCPS — mccps.fastapi.online

SEO-first rebuild of mccp.services (Merchant Credit Card Processing Services). Static site (no frameworks) on
GitHub Pages (`main` → `/docs`). Built on the same engine as the Fidelity Funding v2 site.

## Build
    python3 build.py      # src/ + content/ -> docs/
    cd docs && python3 -m http.server 8767

## What's here
- **200 SEO pages** as data in `content/pages/<slug>.json` — 50 industries, 30 solutions, 30 how-to guides,
  90 blog posts. Master list `content/manifest.py`, writing/compliance rules `content/SPEC.md`.
  Each renders with breadcrumbs, TOC, takeaways, mid-article CTA, FAQ, related links, an industry savings estimator,
  and JSON-LD (BreadcrumbList, FAQPage, Article/WebPage).
- **Pages:** home (3D card hero from the earlier refresh, savings slider, Zero program, scroll story), free savings
  analysis wizard, agents + agent FAQ, about, contact, privacy, terms of use (carried over from the live site).
- **Tools:** savings calculator, effective-rate check, flat vs tiered vs interchange-plus comparison (editable
  assumptions), terminal finder; payments glossary (DefinedTermSet).
- **Brand:** MCCPS blue #1565C0 / green #2E9E4F, light product-led look, dark mode. Platform referred to as
  "PayPilot by MCCPS". Business funding cross-links to Fidelity Funding.
- **SEO plumbing:** sitemap index, robots, RSS, llms.txt, canonical/OG/Twitter, search index, ⌘K site search,
  MCCPS AI assistant (local knowledge base + site search), offline service worker.

## Not wired to a backend (by design)
The free analysis, contact, agent and newsletter forms show a confirmation only — nothing is sent. To go live, POST
from `submit()` in `src/assets/js/analysis.js` and the `data-fake-form` handler in `site.js` (e.g. Formspree, as the
earlier refresh used).
