import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
const require = createRequire(new URL('../frontend/package.json', import.meta.url));
const { chromium } = require('playwright');
const { default: AxeBuilder } = require('@axe-core/playwright');
const base = process.env.JCRM_BASE_URL || 'http://127.0.0.1:8080';
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-gpu', '--renderer-process-limit=2', '--num-raster-threads=1'] });
const results = { recordedAt: new Date().toISOString(), node: process.version, accessibility: [], performance: null };
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const snapshot=await (await context.request.get(base+'/api/workspace')).json();
  const acme=snapshot.accounts.find(a=>a.name==='Acme');
  const deal=snapshot.deals.find(d=>d.accountId===acme.id&&d.stage==='Proposal');
  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of ['/', '/pipeline', '/relationships', '/work', '/ai', '/deals/'+deal.id]) {
      await page.goto(base + path);
      await page.locator('main h1').first().waitFor();
      if (path === '/ai') await page.locator('.ai-answer').waitFor();
      const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      results.accessibility.push({ path: path.startsWith('/deals/')?'/deals/:id':path, width, violations: scan.violations.map(v => ({ id: v.id, impact: v.impact, targets: v.nodes.map(n => n.target) })) });
    }
  }
  const times = [];
  for (let i = 0; i < 50; i++) {
    const start = performance.now();
    const response = await context.request.get(base + '/api/workspace');
    if (!response.ok()) throw new Error('API performance request failed.');
    await response.body();
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  await page.close();
  const probe = await context.newPage();
  await probe.setViewportSize({ width: 390, height: 844 });
  await probe.addInitScript(() => {
    window.__jcrmMetrics = { lcp: 0, cls: 0 };
    new PerformanceObserver(list => { window.__jcrmMetrics.lcp = list.getEntries().at(-1).startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__jcrmMetrics.cls += entry.value; }).observe({ type: 'layout-shift', buffered: true });
  });
  const cdp = await context.newCDPSession(probe);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750, connectionType: 'cellular4g' });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await probe.goto(base, { waitUntil: 'networkidle' });
  await probe.locator('.metrics-grid').waitFor();
  await probe.waitForTimeout(800);
  const metrics = await probe.evaluate(() => window.__jcrmMetrics);
  results.performance = { profile: 'Chromium, 390x844 CSS px, cold cache, 150 ms latency, 1.6 Mbps download, 750 Kbps upload, 4x CPU slowdown; localhost packaged app', lcpMs: Math.round(metrics.lcp), cls: Number(metrics.cls.toFixed(4)), workspaceApiP95Ms: Number(times[Math.ceil(times.length * .95) - 1].toFixed(1)), apiRequests: times.length };
  await writeFile(new URL('../docs/verification-results.json', import.meta.url), JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify(results, null, 2));
  if (results.accessibility.some(check => check.violations.length)) throw new Error('Accessibility scan found violations.');
} finally { await browser.close(); }
