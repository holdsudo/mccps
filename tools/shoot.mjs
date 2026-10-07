// Screenshot helper: node tools/shoot.mjs <url> <out.png> [width] [height] [fullPage] [scrollY] [js]
import { createRequire } from 'module';
const require = createRequire('/Users/championautofinance/guallpas-million-site/package.json');
const { chromium } = require('playwright-core');
const [url, out, w = '1440', h = '900', full = '0', sy = '0', js = ''] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const errs = [];
p.on('pageerror', e => errs.push('pageerror: ' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await p.goto(url, { waitUntil: 'networkidle' });
if (full === '1') { // trigger reveals by scrolling through
  const H = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H; y += 500) { await p.evaluate(v => scrollTo(0, v), y); await p.waitForTimeout(120); }
  await p.evaluate(() => scrollTo(0, 0));
}
if (+sy) await p.evaluate(v => scrollTo(0, v), +sy);
if (js) await p.evaluate(js);
await p.waitForTimeout(1600);
await p.screenshot({ path: out, fullPage: full === '1' });
console.log(errs.length ? errs.join('\n') : 'no errors');
await b.close();
