import { createRequire } from 'module';
const require = createRequire('/Users/championautofinance/guallpas-million-site/package.json');
const { chromium } = require('playwright-core');
const S = process.argv[2], base = 'http://localhost:8767';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const errs = []; const mk = async (vp) => { const p = await b.newPage({ viewport: vp }); p.on('pageerror', e => errs.push(p.url() + ' ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push(p.url() + ' ' + m.text())); return p; };
let p = await mk({ width: 1440, height: 900 });
await p.goto(base + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
console.log('3d card', await p.$eval('[data-hero-card]', e => e.classList.contains('has-3d')));
console.log('home savings', await p.textContent('[data-est-out]'));
await p.click('#ai-fab'); await p.fill('#ai-text', 'I process 60k a month'); await p.keyboard.press('Enter'); await p.waitForTimeout(4500);
console.log('ai', (await p.$$eval('.msg__bubble', a => a.at(-1).textContent)).slice(0, 140));
await p.fill('#ai-text', 'can I keep my terminal'); await p.keyboard.press('Enter'); await p.waitForTimeout(4000);
console.log('ai2', (await p.$$eval('.msg__bubble', a => a.at(-1).textContent)).slice(0, 100));
await p.goto(base + '/tools/savings-calculator/', { waitUntil: 'networkidle' }); console.log('savings', await p.textContent('#o-now'), await p.textContent('#o-lower-save'));
await p.goto(base + '/tools/pricing-model-comparison/', { waitUntil: 'networkidle' }); console.log('pricing', await p.$$eval('#pm-out h3', a => a.map(x => x.textContent)), await p.textContent('.match.top h3'));
await p.goto(base + '/tools/terminal-finder/', { waitUntil: 'networkidle' });
for (const a of ['store', 'tables', 'tips', 'no', 'no']) { await p.click(`.quiz__q.is-on [data-a="${a}"]`); await p.waitForTimeout(120); }
console.log('finder top', await p.textContent('.match.top h3'));
await p.goto(base + '/tools/processing-fee-calculator/', { waitUntil: 'networkidle' }); console.log('eff', await p.textContent('#o-eff'));
await p.goto(base + '/free-analysis/?volume=60000&industry=restaurants', { waitUntil: 'networkidle' });
await p.click('#btn-next'); await p.waitForTimeout(300);
await p.fill('#b-name', 'Joe Pizza'); await p.check('input[name=years][value="2+ years"]', { force: true }); await p.check('input[name=accept][value="In store"]', { force: true });
console.log('industry prefill', await p.inputValue('#b-industry'));
await p.click('#btn-next'); await p.waitForTimeout(400); console.log('volume prefill', await p.inputValue('#p-volume'));
await p.click('#btn-next'); await p.waitForTimeout(400);
await p.fill('#c-name', 'Joe Smith'); await p.fill('#c-email', 'joe@example.com'); await p.fill('#c-phone', '7185551234');
await p.click('#btn-next'); await p.waitForTimeout(500);
console.log('review', (await p.textContent('#review')).replace(/\s+/g, ' ').slice(0, 200));
await p.check('#s-agree'); await p.click('#btn-next'); await p.waitForTimeout(1800);
console.log('success', await p.isVisible('#apply-success'));
await p.goto(base + '/blog/', { waitUntil: 'networkidle' }); console.log('blog cards', await p.$$eval('.ecard:not([hidden])', a => a.length)); await p.click('[data-filter=pricing]'); console.log('pricing filter', await p.$$eval('.ecard:not([hidden])', a => a.length));
await p.keyboard.press('Meta+k'); await p.keyboard.type('chargeback'); await p.waitForTimeout(700); console.log('cmdk', await p.$$eval('.cmdk__item', a => a.slice(1, 4).map(x => x.textContent.trim())));
for (const u of ['/', '/industries/restaurants/', '/tools/savings-calculator/', '/tools/pricing-model-comparison/', '/free-analysis/', '/agents/', '/glossary/', '/blog/']) {
  const q = await mk({ width: 390, height: 844 }); await q.goto(base + u, { waitUntil: 'networkidle' });
  const ov = await q.evaluate(() => document.documentElement.scrollWidth > innerWidth); if (ov || u === '/') await q.screenshot({ path: S + '/mob' + u.replace(/\//g, '_') + '.png' }); console.log('mobile', u, 'overflow:', ov); await q.close();
}
console.log(errs.length ? 'ERRORS\n' + errs.join('\n') : 'no errors'); await b.close();
