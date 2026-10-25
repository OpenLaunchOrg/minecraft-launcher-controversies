import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

// Runs exclusively on a GitHub-hosted runner. No private source or credentials enter the page.
const server = spawn('python3', ['-m', 'http.server', '4173', '--bind', '127.0.0.1', '--directory', 'site'], { stdio: 'ignore' });
let browser;
const origin = 'http://127.0.0.1:4173';
try {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try { if ((await fetch(origin)).ok) break; } catch { /* Wait for the runner's local server. */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  await mkdir('site-checks', { recursive: true });
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.url().startsWith(origin) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(origin, { waitUntil: 'networkidle' });
  assert.equal(await page.title(), '公开记录 · Minecraft 启动器事件与 OpenLaunch');
  assert.equal(await page.locator('.event').count(), 5);
  assert.equal(await page.locator('#source-list li').count(), 13);
  assert.equal(await page.locator('h1').count(), 1);
  assert.equal(await page.locator('html').getAttribute('data-motion'), 'full');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Desktop overflow');
  await page.screenshot({ path: 'site-checks/desktop-hero.png' });

  await page.locator('#event-4').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('#stage-index').textContent === '04 / 05');
  assert.equal(await page.locator('[data-scene="3"]').evaluate(el => getComputedStyle(el).visibility), 'visible');
  await page.screenshot({ path: 'site-checks/desktop-timeline.png' });

  await page.locator('#open-sources').click();
  assert.equal(await page.locator('#source-dialog').evaluate(el => el.open), true);
  assert.equal(await page.locator('#source-list a').count(), 13);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#source-dialog').evaluate(el => el.open), false);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'open-sources', 'Dialog restores focus');

  await page.locator('#play-demo').click();
  assert.equal(await page.locator('#demo-count').textContent(), '1 / 3');
  await page.locator('#play-demo').click();
  assert.match(await page.locator('#play-demo').textContent(), /继续/);
  await page.waitForTimeout(1700);
  assert.equal(await page.locator('#demo-count').textContent(), '1 / 3', 'Pause stops the sequence');
  await page.locator('#play-demo').click();
  await page.waitForFunction(() => document.querySelector('#demo-count').textContent === '3 / 3');
  assert.match(await page.locator('#demo-status').textContent(), /完成/);
  await page.screenshot({ path: 'site-checks/desktop-launcher.png' });
  await page.locator('#play-demo').click();
  assert.equal(await page.locator('#demo-count').textContent(), '1 / 3', 'Replay restarts the demonstration');
  await page.locator('#play-demo').click();

  await page.locator('.motion-toggle').click();
  assert.equal(await page.locator('html').getAttribute('data-motion'), 'reduced');
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('data-motion'), 'reduced', 'Motion choice persists');

  const reduced = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await reduced.goto(origin, { waitUntil: 'networkidle' });
  assert.equal(await reduced.locator('html').getAttribute('data-motion'), 'reduced');
  assert.equal(await reduced.locator('.motion-toggle').isDisabled(), true, 'OS motion preference wins');
  assert.equal(await reduced.locator('.archive-cover').evaluate(el => getComputedStyle(el).animationName), 'none');
  await reduced.locator('#event-5').scrollIntoViewIfNeeded();
  assert.equal(await reduced.locator('#event-5 h2').evaluate(el => getComputedStyle(el).opacity), '1');
  await reduced.screenshot({ path: 'site-checks/reduced-motion.png' });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  mobile.on('pageerror', error => errors.push(error.message));
  await mobile.goto(origin, { waitUntil: 'networkidle' });
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Mobile overflow');
  await mobile.screenshot({ path: 'site-checks/mobile-hero.png', fullPage: false });
  await mobile.locator('#open-sources').click();
  assert.equal(await mobile.locator('#source-dialog').evaluate(el => el.open), true);
  await mobile.locator('#close-sources').click();
  await mobile.locator('#play-demo').click();
  await mobile.waitForFunction(() => document.querySelector('#demo-count').textContent === '3 / 3');
  await mobile.locator('#launcher').scrollIntoViewIfNeeded();
  await mobile.screenshot({ path: 'site-checks/mobile-launcher.png' });

  const plain = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await plain.goto(origin);
  assert.equal(await plain.locator('.event').count(), 5);
  assert.equal(await plain.locator('#event-5 h2').evaluate(el => getComputedStyle(el).opacity), '1', 'No-JS content stays readable');
  assert.equal(await plain.locator('a[href*="releases/tag/v0.1.0"]').count(), 1);
  assert.deepEqual(errors, [], 'No page errors or failed local assets');
  await writeFile('site-checks/results.json', JSON.stringify({ passed: true, desktop: '1440×1000', mobile: '390×844', checks: ['chapter navigation', 'source dialog and focus', 'demo play/pause/replay', 'motion preference persistence', 'OS reduced motion', 'mobile overflow', 'no-JavaScript reading', 'asset and page errors'] }, null, 2));
  console.log('Passed: desktop, mobile, reduced motion, source dialog, migration demo, and no-JavaScript reading.');
} finally {
  if (browser) await browser.close();
  server.kill();
}
