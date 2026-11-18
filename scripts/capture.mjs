import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
const require = createRequire(new URL('../frontend/package.json', import.meta.url));
const { chromium } = require('playwright');
const base = process.env.JCRM_BASE_URL || 'http://127.0.0.1:8080';
const directory = new URL('../docs/screenshots/', import.meta.url);
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-gpu', '--renderer-process-limit=2', '--num-raster-threads=1'] });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  async function visit(path) {
    await page.goto(base + path);
    await page.locator('main h1').first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Page overflow at ' + path);
  }
  async function capture(name, fullPage = false) { await page.screenshot({ path: new URL(name + '.png', directory).pathname, fullPage }); console.log('Captured ' + name); }
  await visit('/');
  const snapshot = await (await page.request.get(base + '/api/workspace')).json();
  const acme = snapshot.accounts.find(a => a.name === 'Acme');
  const deal = snapshot.deals.find(d => d.accountId === acme.id && d.stage === 'Proposal');
  await capture('overview-desktop', true);
  await visit('/pipeline'); await capture('pipeline-desktop');
  await visit('/deals/' + deal.id); await capture('deal-desktop', true);
  await page.setViewportSize({ width: 1024, height: 768 }); await visit('/'); await capture('overview-tablet');
  await page.setViewportSize({ width: 390, height: 844 }); await visit('/'); await capture('overview-mobile');
  await visit('/deals/' + deal.id); await capture('deal-mobile');
  await visit('/ai?action=draft&deal=' + deal.id); await page.locator('.draft-composer').waitFor(); await capture('juno-mobile');
  for (const width of [360, 390, 720, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/pipeline', '/relationships', '/work', '/ai', '/deals/' + deal.id]) await visit(path);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('No page overflow or JavaScript errors at 360, 390, 720, 1024, and 1440 px across the primary routes.');
} finally { await browser.close(); }
