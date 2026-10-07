import { createRequire } from 'module';
const require = createRequire('/Users/championautofinance/guallpas-million-site/package.json');
const { chromium } = require('playwright-core');
const S = process.argv[2], base = 'http://localhost:8766';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const errs = []; const mk = async (vp) => { const p = await b.newPage({ viewport: vp }); p.on('pageerror', e => errs.push(p.url() + ' ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push(p.url() + ' ' + m.text())); return p; };
let p = await mk({ width: 1440, height: 900 });
await p.goto(base + '/tools/funding-calculator/', { waitUntil: 'networkidle' });
console.log('calc', await p.textContent('#o-payback'), await p.textContent('#o-pay'), await p.textContent('#o-apr'));
await p.click('#c-mode [data-v=loan]'); await p.waitForTimeout(200); console.log('loan', await p.textContent('#o-payback'), await p.textContent('#o-pay'), await p.textContent('#o-apr'));
await p.goto(base + '/tools/compare-offers/', { waitUntil: 'networkidle' });
console.log('best offer', await p.$eval('.offer.is-best h3', e => e.textContent.trim()));
await p.goto(base + '/tools/qualify/', { waitUntil: 'networkidle' });
for (const a of ['6-24', '20-100', 'low', 'ops', 'now', 'no']) { await p.click(`.quiz__q.is-on [data-a="${a}"]`); await p.waitForTimeout(120); }
console.log('quiz top', await p.$eval('.match.top h3', e => e.textContent));
await p.screenshot({ path: S + '/quiz.png' });
await p.goto(base + '/tools/processing-fee-calculator/', { waitUntil: 'networkidle' });
console.log('proc', await p.textContent('#o-eff'), await p.textContent('#o-lvl'));
await p.goto(base + '/', { waitUntil: 'networkidle' });
await p.click('#finder-in'); await p.keyboard.type('dental'); await p.waitForTimeout(600);
console.log('finder', await p.$$eval('.finder__list a', a => a.slice(0, 3).map(x => x.textContent)));
await p.keyboard.press('Meta+k'); await p.waitForTimeout(200); await p.keyboard.type('factor rate'); await p.waitForTimeout(600);
console.log('cmdk', await p.$$eval('.cmdk__item', a => a.slice(0, 5).map(x => x.textContent.trim())));
await p.keyboard.press('Escape');
await p.click('#ai-fab'); await p.fill('#ai-text', 'how do confessions of judgment work'); await p.keyboard.press('Enter'); await p.waitForTimeout(5000);
console.log('ai', (await p.$$eval('.msg__bubble', a => a.at(-1).textContent)).slice(0, 160));
await p.goto(base + '/search/?q=payroll', { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
console.log('search', await p.$$eval('#search-results .ccard', a => a.length));
await p.goto(base + '/blog/', { waitUntil: 'networkidle' });
console.log('blog visible', await p.$$eval('.vcard:not([hidden])', a => a.length)); await p.click('[data-more]'); console.log('after more', await p.$$eval('.vcard:not([hidden])', a => a.length));
await p.click('[data-filter=processing]'); console.log('processing filter', await p.$$eval('.vcard:not([hidden])', a => a.length));
for (const u of ['/', '/industries/trucking/', '/tools/funding-calculator/', '/tools/compare-offers/', '/card-processing/', '/glossary/', '/blog/', '/apply/']) {
  const q = await mk({ width: 390, height: 844 }); await q.goto(base + u, { waitUntil: 'networkidle' });
  console.log('mobile', u, 'overflow:', await q.evaluate(() => document.documentElement.scrollWidth > innerWidth)); if (u === '/industries/trucking/') await q.screenshot({ path: S + '/m-art.png' }); await q.close();
}
console.log(errs.length ? 'ERRORS\n' + errs.join('\n') : 'no errors'); await b.close();
