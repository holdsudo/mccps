// MCCPS AI — front-end assistant.
// No backend yet: answers come from a local knowledge base built from the site's own content.
// To connect a real model later, replace `think()` with a fetch to your API and keep the same
// { text, actions } return shape.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const fab = $('#ai-fab'), panel = $('#ai-panel'), body = $('#ai-body'), form = $('#ai-form'),
        input = $('#ai-text'), send = $('#ai-send'), mic = $('#ai-mic'), welcome = $('#ai-welcome'), nudge = $('#ai-nudge');
  if (!panel) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = { get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch { return null; } },
                  set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch {} } };
  const money = (n) => window.FF ? FF.money(n) : '$' + n.toLocaleString();
  const PHONE = '<a href="tel:+18448266227">844.826.6227</a>', EMAIL = '';
  const A = {
    apply: (amt) => ({ label: 'Get my free analysis', href: '/free-analysis/' + (amt ? '?volume=' + amt : ''), icon: 'file' }),
    call: { label: 'Call 844.826.6227', href: 'tel:+18448266227', icon: 'phone' },
    contact: { label: 'Contact page', href: '/contact/', icon: 'chat' },
    zero: { label: 'Zero Processing Fees', href: '/solutions/zero-processing-fees/', icon: 'bolt' },
    calc: { label: 'Savings calculator', href: '/tools/savings-calculator/', icon: 'calc' },
    agents: { label: 'Agent program', href: '/agents/', icon: 'users' },
    blog: { label: 'Read guides', href: '/blog/', icon: 'book' },
  };
  const KB = [
    [/\b(hi|hello|hey|yo|good (morning|afternoon|evening))\b/, () => ({ text: `Hi! 👋 I'm MCCPS AI. I can estimate what card processing costs you, explain your statement, or walk you through the Zero Processing Fees program. What are you working on?` })],
    [/\b(thank|thanks|thx|appreciate)/, () => ({ text: `Anytime! When you're ready, the free statement analysis shows your real numbers line by line — no obligation.`, actions: [A.apply()] })],
    [/(zero|dual pric|cash discount|no (processing )?fees?|\$0)/, () => ({ text: `The **Zero Processing Fees** program is a compliant **dual-pricing** setup: you post a cash price and a card price, so customers who pay by card cover the processing cost — which can take your cost to **$0**.\n\n- Proper signage and receipt disclosure are required\n- Card-network rules and state laws apply, and they vary\n- We help you set it up the compliant way\n\nIt's not right for every business — we'll tell you honestly in your free analysis.`, actions: [A.zero, A.apply()] })],
    [/(surcharg|convenience fee|pass (the )?fees?)/, () => ({ text: `There are three main ways to pass processing costs on: **surcharging** (a fee on credit cards), **cash discount/dual pricing**, and **convenience fees** (for an alternative payment channel). Each has different card-network rules, disclosure requirements and state-law limits — so it pays to set it up carefully.`, actions: [{ label: 'Compare the options', href: '/use-cases/pass-fees-to-customers/', icon: 'scale' }, A.zero] })],
    [/(interchange|flat.?rate|tiered|pricing model|markup|ic\+|interchange.?plus)/, () => ({ text: `Your processing cost has three layers:\n\n- **Interchange** — set by the card networks and paid to the issuing bank (the biggest piece)\n- **Assessments** — network fees\n- **Processor markup** — the only part that's actually negotiable\n\n**Flat-rate** bundles everything into one number; **tiered** sorts transactions into buckets (often hiding cost); **interchange-plus** passes interchange through and shows the markup. Our pricing comparison tool shows the difference on your volume.`, actions: [{ label: 'Compare pricing models', href: '/tools/pricing-model-comparison/', icon: 'scale' }, A.apply()] })],
    [/(effective rate|how much (am i|do i) pay|what am i paying|statement|fees? (too )?high|overpay)/, () => ({ text: `The fastest gut-check is your **effective rate**: total fees ÷ total card volume from last month's statement. Then send us two statements — we'll go through them line by line and show you exactly where the money goes.`, actions: [{ label: 'Check my effective rate', href: '/tools/processing-fee-calculator/', icon: 'calc' }, A.apply()] })],
    [/(free analysis|savings analysis|how does the (free )?analysis|analy[sz]e my)/, () => ({ text: `It's quick and free:\n\n- **Tell us about your business** — how you take payments today\n- **Send two months of processing statements**\n- **Get a line-by-line breakdown** and a no-obligation proposal\n\nWherever possible you keep your existing terminals.`, actions: [A.apply(), A.call] })],
    [/(terminal|reader|hardware|keep my (current )?(machine|equipment|terminal)|countertop|wireless)/, () => ({ text: `In many cases you can **keep your current terminal** — re-programmable terminals can be set up on MCCPS. If you need new hardware, there are countertop, wireless and mobile options with **EMV chip and tap-to-pay**. Try the terminal finder for a quick recommendation.`, actions: [{ label: 'Terminal finder', href: '/tools/terminal-finder/', icon: 'target' }, A.apply()] })],
    [/(pos|point of sale|integrat|software)/, () => ({ text: `MCCPS integrates with almost any **POS, smartphone or terminal**, with multiple gateways to fit your setup — so you usually don't have to rip out the system your staff already knows.`, actions: [{ label: 'POS systems', href: '/solutions/pos-systems/', icon: 'gear' }, A.apply()] })],
    [/(online|website|ecommerce|e-commerce|gateway|shopping cart|checkout)/, () => ({ text: `For online payments you get a **secure payment gateway** that plugs into your website, cart or invoicing — with tokenization and fraud tools like AVS/CVV checks to keep card-not-present risk down.`, actions: [{ label: 'Online gateway', href: '/solutions/payment-gateway/', icon: 'cart' }, A.apply()] })],
    [/(recurring|subscription|membership|autopay|monthly billing)/, () => ({ text: `Recurring billing handles **subscriptions, memberships and payment plans** automatically, with reporting — and account updater features help cut failed payments when cards expire.`, actions: [{ label: 'Recurring billing', href: '/solutions/recurring-billing/', icon: 'refresh' }] })],
    [/(next.?day|deposit|how fast.*(money|paid|funds)|funding time|settle)/, () => ({ text: `**Next-day funding is available** — batch before the cutoff and deposits typically land the next business day, so your cash flow isn't waiting on your processor.`, actions: [{ label: 'Next-day funding', href: '/solutions/next-day-funding/', icon: 'clock' }, A.apply()] })],
    [/(chargeback|dispute)/, () => ({ text: `Chargebacks are cheaper to prevent than to fight: clear descriptors, signed receipts or delivery proof, quick refunds when warranted, and fraud checks for online orders. When one does land, respond fast with documentation.`, actions: [{ label: 'Reduce chargebacks', href: '/use-cases/reduce-chargebacks/', icon: 'shield' }] })],
    [/(pci|secur|fraud|breach|encrypt|emv|token)/, () => ({ text: `MCCPS helps with **PCI compliance** and uses end-to-end encryption, EMV chip and tokenization so card data stays protected. If you're paying a monthly "PCI non-compliance" fee, that's usually fixable.`, actions: [{ label: 'PCI compliance', href: '/solutions/pci-compliance/', icon: 'lock' }] })],
    [/(level ?2|level ?3|b2b|corporate card|purchasing card)/, () => ({ text: `If you sell to other businesses, **Level 2/3 processing** passes extra transaction data (tax, PO number, line items) that can qualify corporate and purchasing cards for lower interchange.`, actions: [{ label: 'Level 2 & 3', href: '/solutions/level-2-and-level-3-processing/', icon: 'briefcase' }] })],
    [/(switch|change processor|cancel|contract|early termination|lease)/, () => ({ text: `Switching is usually smoother than people expect. Check your current contract for an **early termination fee** and any **equipment lease** (leases are often non-cancellable). We'll help you plan the move so there's no gap in taking payments.`, actions: [{ label: 'Switching guide', href: '/solutions/switch-payment-processors/', icon: 'refresh' }, A.apply()] })],
    [/(agent|iso|residual|sell merchant|referral|commission|join (your )?team)/, () => ({ text: `MCCPS works with **independent sales agents and ISOs** across the country. You refer and sign merchants, and earn **residuals** for as long as they process with MCCPS — plus overrides on your team. Set your own hours, work solo or build a team.`, actions: [A.agents, { label: 'Agent FAQ', href: '/agents/faq/', icon: 'chat' }] })],
    [/(working capital|loan|funding|cash advance|financ)/, () => ({ text: `MCCPS isn't a lender, but our merchants can explore **business funding through Fidelity Funding** — fast decisions and a soft credit pull for the initial review.`, actions: [{ label: 'Fidelity Funding', href: 'https://fidelity-funding.com', icon: 'cash' }] })],
    [/(rate|price|cost|how much|cheap)/, () => ({ text: `Pricing depends on your card mix, ticket size and how you accept cards, so we quote from your actual statements rather than a teaser rate. The free analysis shows your current cost and our proposal side by side — no obligation.`, actions: [A.apply(), A.calc] })],
    [/(human|person|agent on the phone|representative|someone|talk to|speak|call|phone number|contact|support)/, () => ({ text: `Real people are available **24/7**:\n\n📞 ${PHONE} (844.826.MCCP)\n\nOr send a message and a specialist will reach out.`, actions: [A.call, A.contact] })],
    [/(start|sign up|get started|apply|ready|switch now)/, () => ({ text: `Let's do it. Start with the free savings analysis — a few questions and two statements, and we'll show you exactly what you'd save.`, actions: [A.apply(), A.call] })],
  ];

  const parseAmount = (t) => {
    const m = t.replace(/,/g, '').match(/\$?\s?(\d+(?:\.\d+)?)\s*(k|m|mm|thousand|million|grand)?\b/i);
    if (!m) return 0;
    let n = parseFloat(m[1]); const u = (m[2] || '').toLowerCase();
    if (u === 'k' || u === 'thousand' || u === 'grand') n *= 1e3; else if (u === 'm' || u === 'mm' || u === 'million') n *= 1e6;
    if (!u && n < 1000) return 0; // bare small numbers are probably not amounts
    return n >= 1000 && n <= 5e7 ? Math.round(n) : 0;
  };
  const purposeOf = () => '';

  function think(q) {
    const t = q.toLowerCase(), amount = parseAmount(q), purpose = purposeOf(t);
    const hit = KB.find(([re]) => re.test(t));
    if (amount && (!hit || /\b(process|volume|sales|do|run|month|monthly|a month)\b/.test(t))) {
      const yr = amount * 12, typ = yr * 0.032;
      return { text: `At about **${money(amount)}/month** in card sales, a typical 3.2% effective rate works out to roughly **${money(Math.round(typ))} a year** in processing fees (illustrative).\n\nWith a compliant **Zero Processing Fees** dual-pricing setup, that cost can drop toward **$0** — or we can lower your rate if dual pricing isn't a fit. Your free analysis shows the real numbers from your statements.`,
               actions: [{ label: 'Get my free analysis', href: `/free-analysis/?volume=${amount}`, icon: 'file' }, A.calc] };
    }
    if (hit) {
      const r = hit[1]({ amount, purpose });
      // attach the most relevant guide when the question names a specific topic
      const g = window.FF?.searchIndex ? FF.searchIndex(q, 1)[0] : null;
      const terms = t.split(/\s+/).filter(w => w.length > 3);
      if (g && terms.filter(w => g.t.toLowerCase().includes(w.replace(/s$/, ''))).length >= 2) {
        r.text = `Our guide **${g.t}** covers this in depth. In short:\n\n` + r.text;
        r.actions = [{ label: 'Read the guide', href: g.u, icon: 'book' }].concat(r.actions || []).slice(0, 3);
      }
      return r;
    }
    const found = window.FF?.searchIndex ? FF.searchIndex(q, 3) : [];
    if (found.length) return { text: `Here's what I found in our guides that should help:\n\n${found.map(e => '- **' + e.t + '** — ' + e.d).join('\n')}\n\nWant me to connect you with a specialist too?`, actions: found.map(e => ({ label: e.t.length > 34 ? e.t.slice(0, 32) + '…' : e.t, href: e.u, icon: 'book' })).concat([A.call]) };
    return { text: `I want to make sure you get the right answer. I can help with:\n\n- What you're paying now (effective rate)\n- The Zero Processing Fees program\n- Terminals, POS and online payments\n- Switching processors\n\nOr talk to a person 24/7 at ${PHONE}.`, actions: [A.apply(), A.call] };
  }

  // ---- Rendering ----
  const esc = (s) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const md = (s) => {
    // trusted KB markdown → HTML (KB text may contain our own <a> tags)
    const blocks = s.split(/\n\n/);
    return blocks.map(b => {
      const lines = b.split('\n');
      if (lines.every(l => l.startsWith('- '))) return '<ul>' + lines.map(l => `<li>${inline(l.slice(2))}</li>`).join('') + '</ul>';
      return '<p>' + lines.map(inline).join('<br>') + '</p>';
    }).join('');
  };
  const inline = (s) => s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const icon = (n) => `<svg class="icon" aria-hidden="true"><use href="#i-${n}"/></svg>`;

  let history = store.get('ffai') || [];
  const scroll = () => { body.scrollTop = body.scrollHeight; };

  function bubble(role, html, actions) {
    welcome.hidden = true;
    const m = document.createElement('div');
    m.className = 'msg' + (role === 'me' ? ' msg--me' : '');
    m.innerHTML = (role === 'me' ? '' : `<span class="msg__av">${icon('sparkles')}</span>`) + `<div class="msg__bubble">${html}</div>`;
    if (actions?.length) {
      const a = document.createElement('div'); a.className = 'msg__actions';
      a.innerHTML = actions.map(x => `<a href="${x.href}">${icon(x.icon)}${esc(x.label)}</a>`).join('');
      m.querySelector('.msg__bubble').appendChild(a);
    }
    body.appendChild(m); scroll();
    return m;
  }

  async function stream(el, html) {
    if (reduce) { el.innerHTML = html; return; }
    // reveal word by word while preserving markup
    const tmp = document.createElement('div'); tmp.innerHTML = html;
    const walker = document.createTreeWalker(tmp, NodeFilter.SHOW_TEXT);
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    const full = nodes.map(n => n.textContent); nodes.forEach(n => n.textContent = '');
    el.innerHTML = ''; el.appendChild(tmp);
    for (let i = 0; i < nodes.length; i++) {
      const words = full[i].split(/(\s+)/);
      for (let w = 0; w < words.length; w++) {
        nodes[i].textContent += words[w];
        if (w % 2 === 0) { scroll(); await new Promise(r => setTimeout(r, 14 + Math.random() * 22)); }
      }
    }
  }

  let busy = false;
  async function ask(q, silent) {
    q = (q || '').trim(); if (!q || busy) return;
    busy = true; send.disabled = true;
    bubble('me', esc(q));
    if (!silent) { history.push({ r: 'me', t: q }); }
    const typing = bubble('ai', '<span class="typing"><i></i><i></i><i></i></span>');
    await new Promise(r => setTimeout(r, reduce ? 50 : 500 + Math.random() * 500));
    const ans = think(q);
    const bub = typing.querySelector('.msg__bubble');
    await stream(bub, md(ans.text));
    if (ans.actions?.length) {
      const a = document.createElement('div'); a.className = 'msg__actions';
      a.innerHTML = ans.actions.map(x => `<a href="${x.href}">${icon(x.icon)}${esc(x.label)}</a>`).join('');
      bub.appendChild(a);
    }
    history.push({ r: 'ai', t: ans.text, a: ans.actions });
    store.set('ffai', history.slice(-30));
    scroll(); busy = false; send.disabled = !input.value.trim();
  }

  function restore() {
    history.forEach(h => h.r === 'me' ? bubble('me', esc(h.t)) : bubble('ai', md(h.t), h.a));
  }

  // ---- Open / close ----
  let lastFocus;
  function open(q, opts = {}) {
    window.FF?.loadIndex?.();
    lastFocus = document.activeElement;
    document.body.classList.add('ai-open');
    fab.setAttribute('aria-expanded', 'true');
    hideNudge(true);
    setTimeout(() => input.focus({ preventScroll: true }), 250);
    if (q) setTimeout(() => ask(q), 300);
    if (opts.voice) setTimeout(listen, 400);
  }
  function close() {
    document.body.classList.remove('ai-open');
    fab.setAttribute('aria-expanded', 'false');
    lastFocus?.focus?.();
  }
  window.FFAI = { open, close, ask };

  fab.addEventListener('click', () => open());
  $('#ai-close').addEventListener('click', close);
  $('#ai-reset').addEventListener('click', () => {
    history = []; store.set('ffai', []);
    body.querySelectorAll('.msg').forEach(m => m.remove()); welcome.hidden = false;
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('ai-open')) close(); });
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ask]'); if (b) ask(b.dataset.ask);
  });
  $$('[data-ai-open]').forEach(b => b.addEventListener('click', (e) => { e.preventDefault(); open(b.dataset.aiOpen || undefined); }));
  function $$(s) { return [...document.querySelectorAll(s)]; }

  input.addEventListener('input', () => {
    send.disabled = !input.value.trim() || busy;
    input.style.height = 'auto'; input.style.height = Math.min(120, input.scrollHeight) + 'px';
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
  form.addEventListener('submit', (e) => { e.preventDefault(); const v = input.value; input.value = ''; input.style.height = 'auto'; ask(v); });

  // ---- Voice input (where supported) ----
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec;
  function listen() {
    if (!SR) return;
    if (rec) { rec.stop(); return; }
    rec = new SR(); rec.lang = 'en-US'; rec.interimResults = true;
    mic.classList.add('is-rec');
    rec.onresult = (e) => { input.value = [...e.results].map(r => r[0].transcript).join(''); input.dispatchEvent(new Event('input')); };
    rec.onend = () => { mic.classList.remove('is-rec'); rec = null; if (input.value.trim()) form.requestSubmit(); };
    rec.onerror = () => { mic.classList.remove('is-rec'); rec = null; };
    rec.start();
  }
  if (SR) { mic.hidden = false; mic.addEventListener('click', listen); }
  else { const hm = document.getElementById('askbar-mic'); if (hm) hm.hidden = true; }

  // ---- Proactive nudge (once per browser) ----
  function hideNudge(forever) {
    nudge.classList.remove('is-on');
    if (forever) try { localStorage.setItem('ffai-nudged', '1'); } catch {}
  }
  let nudged = false; try { nudged = !!localStorage.getItem('ffai-nudged'); } catch {}
  if (!nudged) setTimeout(() => { if (!document.body.classList.contains('ai-open')) nudge.classList.add('is-on'); }, 14000);
  nudge.addEventListener('click', (e) => { if (e.target.closest('button')) hideNudge(true); else open('Estimate my processing fees'); });

  KB.unshift([/estimate (my )?(fees|savings|processing)/, () => ({ text: `Happy to! Roughly how much do you process in card sales per month? Reply with a number like "$40,000" or "25k".` })]);

  restore();
})();
