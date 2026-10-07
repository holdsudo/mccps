import { createRequire } from 'module';
const require = createRequire('/Users/championautofinance/guallpas-million-site/package.json');
const { chromium } = require('playwright-core');
const S = process.argv[2], base = 'http://localhost:8765';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const errs = [];
const mk = async (vp) => { const p = await b.newPage({ viewport: vp, deviceScaleFactor: 1 }); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text())); return p; };
// mobile home
let p = await mk({ width: 390, height: 844 });
await p.goto(base + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
await p.screenshot({ path: S + '/m-home.png' });
await p.click('.nav__burger'); await p.waitForTimeout(700); await p.screenshot({ path: S + '/m-menu.png' }); await p.click('.nav__burger');
// assistant
await p.click('#ai-fab'); await p.waitForTimeout(500);
await p.fill('#ai-text', 'I need 80k for a new truck'); await p.keyboard.press('Enter');
await p.waitForTimeout(4500); await p.screenshot({ path: S + '/m-ai.png' });
const href = await p.$eval('.msg__actions a', a => a.getAttribute('href'));
console.log('ai action:', href);
await p.close();
// desktop assistant + cmdk
p = await mk({ width: 1440, height: 900 });
await p.goto(base + '/', { waitUntil: 'networkidle' });
await p.click('#askbar-in'); await p.fill('#askbar-in', 'Will applying affect my credit?'); await p.keyboard.press('Enter');
await p.waitForTimeout(4000); await p.screenshot({ path: S + '/d-ai.png' });
await p.keyboard.press('Escape'); await p.keyboard.press('Meta+k'); await p.waitForTimeout(300); await p.keyboard.type('car'); await p.waitForTimeout(300);
await p.screenshot({ path: S + '/d-cmdk.png' }); await p.keyboard.press('Escape');
// apply flow
await p.goto(base + '/apply/?amount=150000&purpose=equipment', { waitUntil: 'networkidle' });
await p.click('#btn-next'); await p.waitForTimeout(500); await p.screenshot({ path: S + '/d-apply-err.png' });
const f = { '#a-legal': 'Acme Trucking LLC', '#a-ein': '123456789', '#a-start': '2019-05-01', '#a-addr': '1 Main St', '#a-city': 'Staten Island', '#a-zip': '10314', '#a-phone': '7185551234' };
for (const [k, v] of Object.entries(f)) await p.fill(k, v);
await p.selectOption('#a-state', 'NY'); await p.selectOption('#a-ind', { index: 3 }); await p.selectOption('#a-entity', 'LLC'); await p.check('input[name=location_type][value=Leased]', { force: true });
await p.click('#btn-next'); await p.waitForTimeout(500);
const o = { '#o-name': 'Joe Smith', '#o-email': 'joe@example.com', '#o-cell': '7185559876', '#o-own': '100', '#o-ssn': '123456789', '#o-dob': '1980-01-01', '#o-addr': '2 Elm St', '#o-city': 'Staten Island', '#o-zip': '10314' };
for (const [k, v] of Object.entries(o)) await p.fill(k, v);
await p.selectOption('#o-state', 'NY');
await p.click('#btn-next'); await p.waitForTimeout(500);
console.log('amount prefill:', await p.inputValue('#f-amt'), await p.inputValue('#f-use'));
await p.fill('#f-rev', '1200000'); await p.check('input[name=judgments][value=No]', { force: true });
await p.click('#btn-next'); await p.waitForTimeout(800);
await p.fill('#s-name', 'Joe Smith'); await p.check('#s-agree');
const box = await p.$eval('#sig-canvas', c => { const r = c.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; });
await p.mouse.move(box[0] + 40, box[1] + 100); await p.mouse.down(); for (let i = 0; i < 20; i++) await p.mouse.move(box[0] + 40 + i * 12, box[1] + 100 + Math.sin(i) * 25); await p.mouse.up();
await p.screenshot({ path: S + '/d-apply-review.png', fullPage: false });
await p.click('#btn-next'); await p.waitForTimeout(2000); await p.screenshot({ path: S + '/d-apply-done.png' });
console.log('success visible:', await p.isVisible('#apply-success'));
// mobile pages
for (const u of ['/apply/', '/careers/', '/insights/', '/contact/', '/insights/trucking-company-mca-2026/']) {
  const q = await mk({ width: 390, height: 844 }); await q.goto(base + u, { waitUntil: 'networkidle' }); await q.waitForTimeout(1200);
  const ov = await q.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  await q.screenshot({ path: S + '/m' + u.replace(/\//g, '_') + '.png' }); console.log(u, 'h-overflow:', ov); await q.close();
}
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no errors');
await b.close();
