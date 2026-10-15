(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
if (fine) document.addEventListener('pointermove', (e) => {
const b = e.target.closest?.('.btn'); if (!b) return;
const r = b.getBoundingClientRect();
b.style.setProperty('--bx', (e.clientX - r.left) + 'px'); b.style.setProperty('--by', (e.clientY - r.top) + 'px');
}, { passive: true });
if (fine && !reduce) {
$$('.tool-card,.ccard,.save-card,.zero,.ecard--feature,.stat,.jcard').forEach(el => el.setAttribute('data-tilt', ''));
$$('[data-tilt]').forEach(el => {
const max = el.classList.contains('save-card') || el.classList.contains('zero') ? 4 : 8;
let raf = 0;
el.addEventListener('pointermove', (e) => {
cancelAnimationFrame(raf);
raf = requestAnimationFrame(() => {
const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
el.classList.add('is-tilting');
el.style.setProperty('--ry', ((x - .5) * max).toFixed(2) + 'deg');
el.style.setProperty('--rx', ((.5 - y) * max).toFixed(2) + 'deg');
el.style.setProperty('--gx', (x * 100).toFixed(1) + '%'); el.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
});
});
el.addEventListener('pointerleave', () => { cancelAnimationFrame(raf); el.classList.remove('is-tilting'); el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
});
}
const ledger = $$('[data-stage-list] li');
if (ledger.length) {
let k = 0; const mark = () => ledger.forEach((li, i) => li.classList.toggle('is-on', i === k));
mark(); if (!reduce) setInterval(() => { k = (k + 1) % ledger.length; mark(); }, 2600);
}
const steps = $('.steps');
if (steps) {
const items = $$('.step', steps);
const upd = () => {
const r = steps.getBoundingClientRect(), vertical = innerWidth <= 960;
const p = clamp((innerHeight * .75 - r.top) / (r.height * (vertical ? 1 : .6) + 1), 0, 1);
steps.style.setProperty('--sp', p.toFixed(3));
items.forEach((s, i) => s.classList.toggle('is-lit', p >= (vertical ? i / items.length : i / (items.length - 1) * .98)));
};
addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true }); addEventListener('resize', upd); upd();
}
const jr = $('[data-journey]');
if (jr) {
const panes = $$('.jpane', jr), copy = $$('.journey__step', jr), bars = $$('.journey__bar i', jr), stack = $('.jstack', jr);
const n = panes.length;
let cur = -1;
const place = (p) => {
const f = p * (n - 1);
panes.forEach((el, i) => {
const d = i - f; // <0 already passed, >0 still coming
const z = d > 0 ? -d * 320 : d * 200, y = d > 0 ? d * 150 : d * 340, rx = d > 0 ? -d * 14 : -d * 40;
const o = d < -.15 ? Math.max(0, 1 + (d + .15) * 1.8) : d > 2.2 ? 0 : 1;
el.style.transform = `translate(-50%,-50%) translate3d(0px,${y.toFixed(1)}px,${z.toFixed(1)}px) rotateX(${rx.toFixed(2)}deg)`;
el.style.opacity = o.toFixed(3);
el.style.zIndex = String(100 - Math.round(Math.abs(d) * 10));
el.style.filter = `brightness(${(1 - Math.min(.55, Math.abs(d) * .35)).toFixed(2)})`;
});
bars.forEach((b, i) => b.style.setProperty('--f', clamp(f - i + 1, 0, 1).toFixed(3)));
const k = clamp(Math.round(f), 0, n - 1);
if (k !== cur) { cur = k; copy.forEach((c, i) => c.classList.toggle('is-on', i === k)); panes.forEach((c, i) => c.classList.toggle('is-on', i === k)); }
};
const pinned = () => !reduce && innerWidth > 960;
const upd = () => {
if (!pinned()) { panes.forEach(el => { el.style.transform = ''; el.style.opacity = ''; }); copy.forEach(c => c.classList.add('is-on')); return; }
const r = jr.getBoundingClientRect(), total = r.height - innerHeight;
place(clamp(-r.top / total, 0, 1));
};
let tick = false;
addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(() => { tick = false; upd(); }); } }, { passive: true });
addEventListener('resize', upd); upd();
}
const ring = $('[data-ring]');
if (ring) {
const track = $('.ring__track', ring), items = $$('.ring__item', ring), n = items.length, step = 360 / n;
items.forEach((el, i) => el.style.setProperty('--ang', (i * step) + 'deg'));
let rot = 0, vel = reduce ? 0 : -.06, drag = false, sx = 0, sr = 0, moved = 0, lastX = 0, lastT = 0, idle = true, snapTo = null;
const radius = () => parseFloat(getComputedStyle(items[0]).getPropertyValue('--r')) || 420;
const apply = () => {
track.style.setProperty('--rot', rot.toFixed(2) + 'deg');
items.forEach((el, i) => {
const a = ((i * step + rot) % 360 + 540) % 360 - 180; // -180..180, 0 = facing
const front = Math.abs(a) < step / 2;
el.tabIndex = front ? 0 : -1;
el.style.opacity = (1 - Math.min(.75, Math.abs(a) / 180 * .9)).toFixed(3);
});
};
const loop = () => {
if (!drag) {
if (snapTo !== null) { rot += (snapTo - rot) * .12; if (Math.abs(snapTo - rot) < .05) { rot = snapTo; snapTo = null; } }
else { rot += vel; if (!idle) { vel *= .95; if (Math.abs(vel) < .02) { idle = true; vel = reduce ? 0 : -.06; snapTo = Math.round(rot / step) * step; } } }
}
apply(); requestAnimationFrame(loop);
};
ring.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; drag = true; moved = 0; sx = lastX = e.clientX; sr = rot; lastT = performance.now(); snapTo = null; ring.classList.add('is-drag'); ring.setPointerCapture(e.pointerId); });
ring.addEventListener('pointermove', (e) => {
if (!drag) return;
const dx = e.clientX - sx, now = performance.now();
moved = Math.max(moved, Math.abs(dx));
rot = sr + dx * (180 / Math.PI) / radius();
vel = (e.clientX - lastX) * (180 / Math.PI) / radius() / Math.max(1, (now - lastT) / 16);
lastX = e.clientX; lastT = now;
});
const end = () => { if (!drag) return; drag = false; idle = false; ring.classList.remove('is-drag'); };
ring.addEventListener('pointerup', end); ring.addEventListener('pointercancel', end);
ring.addEventListener('click', (e) => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
const nudge = (d) => { idle = false; vel = 0; snapTo = (Math.round(rot / step) - d) * step; };
$$('[data-ring-dir]').forEach(b => b.addEventListener('click', () => nudge(+b.dataset.ringDir)));
ring.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { nudge(1); e.preventDefault(); } if (e.key === 'ArrowLeft') { nudge(-1); e.preventDefault(); } });
ring.addEventListener('focusin', (e) => { const i = items.indexOf(e.target.closest('.ring__item')); if (i >= 0) { idle = false; vel = 0; snapTo = -i * step + 360 * Math.round((rot + i * step) / 360); } });
apply(); requestAnimationFrame(loop);
}
if (!reduce) {
const items = $$('main .section > .container, main .section--tight > .container, .hero .container, .page-hero .container, .doc__head')
.filter(el => !el.closest('[data-journey]'));
items.forEach(el => { el.classList.add('depth'); el.parentElement.classList.add('depth-scene'); });
const cta = $$('.cta-band');
let tick = false;
const run = () => {
tick = false;
const H = innerHeight;
for (const el of items) {
const r = el.getBoundingClientRect();
if (r.bottom < -200 || r.top > H + 200) continue;
const enter = clamp((r.top - H * .82) / (H * .35), 0, 1);       // still below the fold
const leave = clamp((H * .28 - r.bottom) / (H * .45), 0, 1);     // scrolled past the top
const z = -(enter * 220 + leave * 260), rx = enter * -14 + leave * 18, y = enter * 60 - leave * 30;
el.style.transform = (enter || leave) ? `translate3d(0,${y.toFixed(1)}px,${z.toFixed(1)}px) rotateX(${rx.toFixed(2)}deg)` : '';
el.style.opacity = (1 - leave * .65 - enter * .35).toFixed(3);
}
for (const b of cta) {
const r = b.getBoundingClientRect(), c = clamp(((r.top + r.height / 2) - H / 2) / H, -1, 1);
b.style.transform = `perspective(1200px) rotateX(${(c * 22).toFixed(2)}deg) scale(${(1 - Math.abs(c) * .06).toFixed(3)})`;
b.style.setProperty('--oy', (c * -80).toFixed(1) + 'px');
}
};
addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(run); } }, { passive: true });
addEventListener('resize', run); run();
}
$$('[data-cols]').forEach(w => {
const r = $('input[type=range]', w.closest('[data-savings]') || document), cur = $('.prism--cur', w), zero = $('.prism--zero', w);
if (!r || !cur) return;
const upd = () => {
const v = +r.value, frac = (v - +r.min) / (+r.max - +r.min);
cur.style.setProperty('--h', (80 + Math.sqrt(frac) * 170).toFixed(0) + 'px');
zero.style.setProperty('--h', '6px');
};
r.addEventListener('input', upd); upd();
});
})();