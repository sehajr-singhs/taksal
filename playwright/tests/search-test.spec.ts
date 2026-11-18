import { test, expect, chromium } from '@playwright/test';

const PAGES = [
  'index.html',
  'about.html',
  'hukamnama.html',
  'guru-granth-sahib.html',
  'dasam-granth.html',
  'vaaran.html',
  'pothis.html',
  'library.html',
  'model.html',
  'signin.html',
];

test('every page loads without errors', async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  for (const pageFile of PAGES) {
    const page = await context.newPage();
    const url = `/${pageFile}`;
    await page.goto(url, { waitUntil: 'networkidle' });

    // Check no horizontal scroll at 390px
    await page.setViewport({ width: 390, height: 844 });
    const horizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(horizontalScroll).toBeFalsy(`Horizontal scroll found on ${pageFile} at 390px`);

    // Check no console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      consoleErrors.push(err.message);
    });

    await page.goto(url, { waitUntil: 'networkidle' });
    await new Promise(r => setTimeout(r, 1000));

    expect(consoleErrors).toEqual([], `Console errors on ${pageFile}: ${consoleErrors.join(', ')}`);
    await page.close();
  }

  await browser.close();
});

test('search works for "Ranjit"', async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();
  await page.goto('/model.html', { waitUntil: 'networkidle' });

  // Wait for search init
  await page.waitForSelector('#search-input', { state: 'visible', timeout: 5000 });

  // Search for "Ranjit"
  await page.fill('#search-input', 'Ranjit');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);

  // Check results appear
  const termLog = page.locator('.term-log');
  const resultCount = await termLog.locator('.log-line-gur').count();
  expect(resultCount).toBeGreaterThan(0, 'Search for "Ranjit" should return results');

  await browser.close();
});

test('search works for "Zafarnama"', async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();
  await page.goto('/model.html', { waitUntil: 'networkidle' });

  // Wait for search init
  await page.waitForSelector('#search-input', { state: 'visible', timeout: 5000 });

  // Search for "Zafarnama"
  await page.fill('#search-input', 'Zafarnama');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);

  // Check results appear
  const termLog = page.locator('.term-log');
  const resultCount = await termLog.locator('.log-line-gur').count();
  expect(resultCount).toBeGreaterThan(0, 'Search for "Zafarnama" should return results');

  await browser.close();
});

test('search works for Gurmukhi word "ਗੁਰੂ"', async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();
  await page.goto('/model.html', { waitUntil: 'networkidle' });

  // Wait for search init
  await page.waitForSelector('#search-input', { state: 'visible', timeout: 5000 });

  // Search for Gurmukhi word "ਗੁਰੂ"
  await page.fill('#search-input', 'ਗੁਰੂ');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);

  // Check results appear
  const termLog = page.locator('.term-log');
  const resultCount = await termLog.locator('.log-line-gur').count();
  expect(resultCount).toBeGreaterThan(0, 'Search for Gurmukhi "ਗੁਰੂ" should return results');

  await browser.close();
});