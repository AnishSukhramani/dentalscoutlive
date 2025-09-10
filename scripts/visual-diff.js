#!/usr/bin/env node
// Minimal screenshot generator for top pages
const { chromium } = require('playwright');

const PAGES = ['/', '/docs/liquid-glass'];

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  for (const route of PAGES) {
    const url = baseUrl + route;
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `visual-diff${route.replace(/\//g, '_') || '_home'}.png`, fullPage: true });
    console.log('Captured', url);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });


