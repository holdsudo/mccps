# Content spec — Fidelity Funding SEO pages

You are writing landing pages / articles for **MCCPS — Merchant Credit Card Processing Services LLC**
(mccp.services), a merchant services company that sets businesses up to accept credit/debit cards in store, online,
by phone and on the go. Its payment platform is branded **PayPilot by MCCPS**. Stated offering: free no-obligation
savings analysis (they review two months of processing statements line by line), the **Zero Processing Fees**
program (a compliant dual-pricing / cash-discount program that can bring card-processing cost to $0 — rules vary by
state and card network), PCI compliance help, next-day funding available, a reporting/analytics dashboard,
integration with almost any POS, smartphone or terminal (often keeping re-programmable terminals the merchant already
owns), multiple gateways, B2B Level 2/3 processing, one-time and recurring payments, EMV and contactless, free 24/7
technical support and personal customer service. Phone: 844.826.6227 (844.826.MCCP). They also recruit
**independent sales agents / ISOs** who earn residuals. They process through registered ISOs of several banks
(don't list them in articles). For business funding needs they refer merchants to **Fidelity Funding**.

## Output
For each assigned page write ONE file: `/Users/championautofinance/mccps/content/pages/<slug>.json`
(slug exactly as in the manifest). Valid JSON, UTF-8, no comments. Schema:

```json
{
  "slug": "restaurants",
  "category": "industries",                 // industries | solutions | use-cases | blog
  "title": "Restaurant Payment Processing",  // H1, natural, <= 70 chars
  "seo_title": "Restaurant Payment Processing & POS | MCCPS",  // <= 65 chars incl. brand "MCCPS"
  "meta_description": "…",                 // 140-158 chars, compelling, includes primary keyword
  "primary_keyword": "restaurant payment processing",
  "keywords": ["…", "…"],                  // 5-8 related/long-tail terms
  "eyebrow": "Industry payments",            // 1-3 words
  "dek": "One-sentence subheading under the H1 (<= 160 chars).",
  "intro": ["paragraph", "paragraph"],      // 2-3 paragraphs, hook with the reader's real situation
  "sections": [                             // 5-7 sections
    {"h2": "…", "paragraphs": ["…"], "bullets": ["…"]},   // bullets optional (3-7 items when present)
    {"h2": "…", "paragraphs": ["…"], "steps": ["…"]}      // OR numbered steps for how-tos (optional)
  ],
  "key_takeaways": ["…", "…", "…"],         // 3-5 one-liners
  "faq": [{"q": "…", "a": "…"}],            // 4-6 real questions people search; answers 40-90 words
  "related": ["slug", "slug", "slug", "slug"],  // 4-6 slugs from manifest.json, mixed categories, genuinely related
  "icon": "utensils",                       // one of: truck utensils store hammer heart car scissors briefcase factory building cash card dollar trend clock shield users rocket gear target flame book file chat scale bolt pin cart phone lock refresh
  "read_minutes": 6
}
```

## Length & quality
- **900–1,400 words** of body copy per page (intro + sections + FAQ answers). Industry/solution/use-case pages
  ≥ 900; blog guides ≥ 1,000.
- Be **genuinely specific**: real payment mechanics (authorization, batching, settlement, interchange categories,
  card-present vs card-not-present, EMV/NFC, tokenization, PCI SAQs, chargeback flow), the actual operational
  details of that industry (e.g. tip-adjust and pre-auth tabs for bars, card-on-file for salons' no-show fees,
  Level 2/3 for B2B), and worked examples that are clearly hypothetical ("say you process $40,000 a month at a
  3.1% effective rate — that's $1,240 in fees").
- **Do not reuse sentences or section structures across pages.** Vary headings, openings and angles. Mention MCCPS
  naturally 2–4 times (e.g. the free statement analysis, keeping existing terminals, 24/7 support, Zero Processing
  Fees). Refer to the platform as "PayPilot by MCCPS" at most once or twice per page.
- One gentle CTA sentence near the end of the last section (no URLs). Second person, plain English, no hype, no emojis.

## Hard rules (compliance)
- **No invented statistics, studies, survey numbers or market sizes.** Worked examples are fine when clearly
  hypothetical. General ranges may be described with hedging (e.g. effective rates commonly land in the
  2–4% range depending on card mix and how cards are accepted).
- **No specific MCCPS rates, prices or savings promises.** Never "we guarantee savings". Say savings depend on the
  statement analysis.
- **Surcharging, cash discount/dual pricing, convenience fees:** always state that rules vary by state and card
  network, require proper disclosure/signage, and that merchants should confirm current requirements. Never claim a
  specific state's current law or a specific surcharge cap as fact.
- **Don't name competitors** (no Square, Stripe, Clover, Toast, PayPal etc.) and don't name the sponsor banks.
- Legal/tax topics (IOLTA trust accounts, data breach response, tax deductibility): general info + "consult your
  attorney/CPA/bar association".
- Agent-program pages: no income promises or example earnings presented as typical.
- Funding mentions: MCCPS refers merchants to **Fidelity Funding** for business funding; MCCPS is not a lender.

## Process
1. Read `/Users/championautofinance/mccps/content/manifest.json` (all 200 pages; use it for `related`).
2. Write your assigned pages one file at a time (use the Write tool).
3. Validate when done: `python3 -c "import json,glob;[json.load(open(f)) for f in glob.glob('/Users/championautofinance/mccps/content/pages/*.json')]"`
   and a word count check for your files. Fix anything invalid or short.
4. Reply with: list of slugs written, min/avg word count. Nothing else.
