// MCCPS — free tools (all calculators are illustrative estimates)
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const money = (n) => (n < 0 ? '-' : '') + '$' + Math.round(Math.abs(n)).toLocaleString('en-US');
  const pct = (n) => (isFinite(n) ? (n * 100).toFixed(1) + '%' : '—');
  const num = (el) => +String(el.value).replace(/[^\d.]/g, '') || 0;

  // Annualized rate from a level payment stream: solve r so PV(payments) = net proceeds.
  function apr(net, pay, n, perYear) {
    if (net <= 0 || pay <= 0 || n <= 0 || pay * n <= net) return 0;
    let r = 0.001;
    for (let k = 0; k < 100; k++) {
      const f = pay * (1 - Math.pow(1 + r, -n)) / r - net;
      const d = pay * ((n * Math.pow(1 + r, -n - 1)) / r - (1 - Math.pow(1 + r, -n)) / (r * r));
      const nr = r - f / d; if (!isFinite(nr) || nr <= 0) { r /= 2; continue; }
      if (Math.abs(nr - r) < 1e-10) { r = nr; break; } r = nr;
    }
    return r * perYear;
  }
  const PER = { daily: [21.67, 'day', 252], weekly: [4.33, 'week', 52], monthly: [1, 'month', 12] };

  // Live outputs for sliders
  $$('.slider-field input').forEach(i => {
    const o = i.closest('.slider-field').querySelector('output');
    const f = () => { o.textContent = i.dataset.fmt === 'money' ? money(+i.value) : i.dataset.fmt === 'x' ? (+i.value).toFixed(2) : i.dataset.fmt === 'pct' ? (+i.value).toFixed(1) + '%' : i.value + (i.dataset.suffix || ''); };
    i.addEventListener('input', f); f();
  });
  $$('.seg-light').forEach(sg => $$('button', sg).forEach(b => b.addEventListener('click', () => {
    $$('button', sg).forEach(x => x.setAttribute('aria-pressed', x === b)); sg.dispatchEvent(new CustomEvent('change', { detail: b.dataset.v, bubbles: true }));
  })));

  // ---- Savings calculator ----
  const sv = $('#savings');
  if (sv) {
    const run = () => {
      const vol = +$('#s-vol').value, rate = +$('#s-rate').value / 100, cut = +$('#s-cut').value / 100;
      const now = vol * rate * 12, lower = vol * Math.max(0, rate - cut) * 12;
      $('#o-now').textContent = money(now); $('#o-mo').textContent = money(vol * rate);
      $('#o-lower').textContent = money(lower); $('#o-lower-save').textContent = money(now - lower);
      $('#o-zero').textContent = '$0'; $('#o-zero-save').textContent = money(now);
      $('#bar-now').style.width = '100%'; $('#bar-lower').style.width = (now ? lower / now * 100 : 0) + '%';
      $('#o-go').href = '/free-analysis/?volume=' + vol;
    };
    sv.addEventListener('input', run); run();
  }

  // ---- Pricing model comparison (editable assumptions) ----
  const pm = $('#pricing');
  if (pm) {
    const run = () => {
      const g = (id) => +$('#' + id).value || 0;
      const vol = g('m-vol'), tkt = Math.max(1, g('m-ticket')), n = vol / tkt;
      const flat = vol * g('m-flat-pct') / 100 + n * g('m-flat-fee');
      const q = g('m-qual') / 100, mq = g('m-mid') / 100, nq = Math.max(0, 1 - q - mq);
      const tier = vol * (q * g('m-t1') + mq * g('m-t2') + nq * g('m-t3')) / 100 + n * g('m-t-fee');
      const icp = vol * (g('m-ic') + g('m-mk')) / 100 + n * (g('m-ic-fee') + g('m-mk-fee'));
      const rows = [['Flat rate', flat], ['Tiered', tier], ['Interchange-plus', icp]];
      const min = Math.min(...rows.map(r => r[1]));
      $('#pm-out').innerHTML = rows.map(([k, v]) => `<div class="match ${v === min ? 'top' : ''}"><span class="ic"><svg class="icon"><use href="#i-${v === min ? 'check' : 'card'}"/></svg></span><span><h3>${k}</h3><p>${money(v)}/month · ${money(v * 12)}/year · ${(vol ? v / vol * 100 : 0).toFixed(2)}% effective</p></span>${v === min ? '<span class="score">Lowest</span>' : ''}</div>`).join('');
      $('#pm-nq').textContent = Math.round(nq * 100) + '%';
    };
    pm.addEventListener('input', run); run();
  }

  // ---- Terminal finder ----
  const tf = $('#quiz');
  if (tf) {
    const qs = $$('.quiz__q', tf), bar = $('#quiz-bar'), ans = {};
    let i = 0;
    const show = () => { qs.forEach((q, k) => q.classList.toggle('is-on', k === i)); bar.style.width = (i / qs.length * 100) + '%'; };
    tf.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      ans[b.closest('.quiz__q').dataset.q] = b.dataset.a;
      if (++i < qs.length) show(); else result();
    });
    $('#quiz-back')?.addEventListener('click', () => { if (i > 0) { i--; show(); } });
    const P = {
      counter: ['Countertop EMV terminal', 'Chip, tap and mobile wallets at a fixed checkout — simple, fast and reliable.', '/solutions/credit-card-terminals/', 'card'],
      wireless: ['Wireless terminal', 'Take payment at the table or curbside, with tip prompts built in.', '/solutions/credit-card-terminals/', 'phone'],
      mobile: ['Mobile reader / tap to phone', 'Turn a smartphone into a terminal for field service, markets and deliveries.', '/solutions/mobile-payments/', 'phone'],
      pos: ['Full POS system', 'Integrated register, inventory, tables or appointments — with payments built in.', '/solutions/pos-systems/', 'gear'],
      gateway: ['Online gateway', 'Secure checkout for your website or cart, plus payment links and invoices.', '/solutions/payment-gateway/', 'cart'],
      vt: ['Virtual terminal', 'Key in card payments for phone and mail orders from any browser.', '/solutions/virtual-terminal/', 'calc'],
      recurring: ['Recurring billing', 'Automate subscriptions, memberships and payment plans.', '/solutions/recurring-billing/', 'refresh'],
    };
    function result() {
      const s = { counter: 0, wireless: 0, mobile: 0, pos: 0, gateway: 0, vt: 0, recurring: 0 };
      const { where, move, extras, phone, repeat } = ans;
      if (where === 'store') { s.counter += 3; s.pos += 2; } if (where === 'online') { s.gateway += 4; } if (where === 'field') { s.mobile += 4; } if (where === 'mix') { s.pos += 2; s.gateway += 2; s.mobile += 1; }
      if (move === 'tables') { s.wireless += 4; s.pos += 1; } if (move === 'fixed') s.counter += 2; if (move === 'everywhere') s.mobile += 3;
      if (extras === 'inventory') s.pos += 3; if (extras === 'tips') { s.wireless += 2; s.pos += 1; } if (extras === 'simple') { s.counter += 2; s.mobile += 1; }
      if (phone === 'yes') s.vt += 3;
      if (repeat === 'yes') s.recurring += 3;
      const top = Object.entries(s).sort((a, b) => b[1] - a[1]).slice(0, 3);
      const max = Math.max(1, top[0][1]);
      $('#quiz-matches').innerHTML = top.map(([k, v], j) => { const p = P[k]; return `<a class="match ${j === 0 ? 'top' : ''}" href="${p[2]}"><span class="ic"><svg class="icon"><use href="#i-${p[3]}"/></svg></span><span><h3>${p[0]}</h3><p>${p[1]}</p></span><span class="score">${Math.max(40, Math.round(v / max * 96))}%</span></a>`; }).join('');
      qs.forEach(q => q.classList.remove('is-on')); bar.style.width = '100%';
      $('.quiz__res', tf).classList.add('is-on');
    }
    $('#quiz-restart')?.addEventListener('click', () => { i = 0; $('.quiz__res', tf).classList.remove('is-on'); show(); });
    show();
  }

  // ---- Processing fee check ----
  const pf = $('#procfee');
  if (pf) {
    const run = () => {
      const vol = num($('#p-vol')), fees = num($('#p-fees')), cut = +$('#p-cut').value / 100;
      const eff = vol ? fees / vol : 0;
      $('#o-eff').textContent = vol ? (eff * 100).toFixed(2) + '%' : '—';
      $('#o-annual').textContent = money(fees * 12);
      $('#o-save').textContent = money(vol * cut * 12);
      $('#o-save-lbl').textContent = `per year if your effective rate were ${(cut * 100).toFixed(2)} pts lower`;
      const lvl = eff > .035 ? ['High', '#E5484D'] : eff > .027 ? ['Worth reviewing', '#F5A524'] : eff ? ['Competitive', '#12B76A'] : ['—', '#8A91A4'];
      $('#o-lvl').textContent = lvl[0]; $('#o-lvl').style.color = lvl[1];
    };
    pf.addEventListener('input', run); run();
  }
})();
