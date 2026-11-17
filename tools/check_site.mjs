import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:8765';
const PAGES = [
  'index.html',
  'hukamnama.html',
  'guru-granth-sahib.html',
  'dasam-granth.html',
  'vaaran.html',
  'pothis.html',
  'library.html',
  'model.html',
  'about.html',
  'signin.html'
];

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  :: ' + detail : ''}`);
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const context = await browser.newContext({ viewport: { width: 1200, height: 900 } });
await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });

const page = await context.newPage();
page.setDefaultTimeout(20000);

let consoleErrors = [];
let pageErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => pageErrors.push(String(err)));

async function load(path) {
  consoleErrors = [];
  pageErrors = [];
  const response = await page.goto(BASE + '/' + path, { waitUntil: 'load' });
  return response;
}

// 1. Every page loads, has chrome, no console errors, no em dashes.
for (const path of PAGES) {
  const response = await load(path);
  check(`${path} HTTP 200`, response && response.status() === 200);
  const info = await page.evaluate(() => ({
    nav: document.querySelectorAll('.side a').length,
    footer: !!document.querySelector('.site-foot'),
    social: document.querySelectorAll('.head-right .social').length,
    signin: !!document.querySelector('.signin'),
    dash: document.body.innerText.includes('\u2014'),
    crumb: (document.querySelector('.crumb') || {}).innerText || ''
  }));
  check(`${path} nav has 9 links`, info.nav === 9, String(info.nav));
  check(`${path} footer present`, info.footer);
  check(`${path} 4 social links and sign in`, info.social === 4 && info.signin);
  check(`${path} no em dash in copy`, !info.dash);
  check(`${path} breadcrumb starts Home`, info.crumb.trim().startsWith('Home'), info.crumb);
  check(`${path} no uncaught page errors`, pageErrors.length === 0, pageErrors.join(' | '));
  check(`${path} no console errors`, consoleErrors.length === 0, consoleErrors.join(' | '));
}

// 2. Home title block in the exact order.
await load('index.html');
const hero = await page.$$eval('.hero h1, .hero > p', (els) => els.map((el) => el.textContent.trim()));
check('hero title block order', JSON.stringify(hero.slice(0, 5)) === JSON.stringify([
  'Taksal',
  'ਟਕਸਾਲ (ṭaksāl)',
  'ਘੜੀਐ ਸਬਦੁ ਸਚੀ ਟਕਸਾਲ ॥',
  'In this true mint, the Word of the Shabad is forged.',
  'Japji Sahib, Pauri 38'
]), JSON.stringify(hero.slice(0, 5)));
check('home has coin svg', (await page.locator('.hero svg.coin').count()) === 1);
const footer = await page.evaluate(() => document.querySelector('.site-foot').innerText);
check('footer mailto', (await page.getAttribute('.reach', 'href')) === 'mailto:sehajrsinghs@gmail.com?subject=Taksal');
check('footer nonprofit and affiliation', footer.includes('Incorporating as a 501(c)(3) nonprofit') && footer.includes('Not affiliated with Damdami Taksal.') && footer.includes('Powered by BaniDB, Surya OCR, open VLMs and Gemma (planned).'));
const socialHrefs = await page.$$eval('.head-right .social', (els) => els.map((el) => el.getAttribute('href')));
check('social links point at placeholder accounts', JSON.stringify(socialHrefs) === JSON.stringify([
  'https://instagram.com', 'https://x.com', 'https://facebook.com', 'https://youtube.com'
]), JSON.stringify(socialHrefs));
const todoComments = await page.content();
check('social links carry TODO comments', (todoComments.match(/TODO: point this at the Taksal/g) || []).length === 4);

// 3. Reader, toggles, citations, ang navigation.
await load('guru-granth-sahib.html');
await page.waitForSelector('.line');
const baseCount = await page.locator('.line').count();
check('ang 1 loads 23 lines from BaniDB', baseCount === 23, String(baseCount));
const padchhedFirst = await page.locator('.line-gurmukhi').first().textContent();

await page.click('[data-mode="larivaar"]');
await page.waitForFunction(() => document.querySelector('.line-gurmukhi').classList.contains('is-larivaar'));
const larivaarFirst = await page.locator('.line-gurmukhi').first().textContent();
check('larivaar joins the words', larivaarFirst !== padchhedFirst && !larivaarFirst.includes(' '), larivaarFirst.slice(0, 30));
check('larivaar applies to every line', (await page.locator('.line-gurmukhi.is-larivaar').count()) === baseCount);

await page.check('[data-toggle="english"]');
await page.waitForFunction(() => document.querySelectorAll('.line-english').length > 0);
check('english toggle adds a translation per line', (await page.locator('.line-english').count()) === baseCount);

await page.check('[data-toggle="translit"]');
await page.waitForFunction(() => document.querySelectorAll('.line-translit').length > 0);
check('transliteration stacks with english', (await page.locator('.line-translit').count()) === baseCount && (await page.locator('.line-english').count()) === baseCount);

await page.click('[data-mode="padchhed"]');
check('padchhed restores split words', (await page.locator('.line-gurmukhi.is-larivaar').count()) === 0);

await page.locator('.cite').first().click();
await page.waitForFunction(() => /Citation copied|Could not copy/.test(document.querySelector('[data-status]').textContent));
const status = await page.locator('[data-status]').textContent();
const clip = await page.evaluate(() => navigator.clipboard.readText());
check('cite copies a source, ang and line', status.includes('Citation copied') && /Sri Guru Granth Sahib Ji, Ang \d+, line \d+/.test(clip), clip.slice(0, 90));

await page.fill('[data-ang-input]', '8');
await page.press('[data-ang-input]', 'Enter');
await page.waitForFunction(() => /Live from BaniDB/.test(document.querySelector('[data-status]').textContent) && document.querySelectorAll('.line').length > 20);
const ang8Count = await page.locator('.line').count();
check('ang jump loads Ang 8', ang8Count === 48, String(ang8Count));
check('ang jump updates the URL', page.url().includes('ang=8'), page.url());
const ang8text = await page.locator('.reader-lines').innerText();
check('Ang 8 contains Japji Pauri 38', ang8text.includes('ਘੜੀਐ ਸਬਦੁ ਸਚੀ ਟਕਸਾਲ'), ang8text.slice(0, 40));

await page.click('[data-ang-next]');
await page.waitForFunction(() => /Live from BaniDB/.test(document.querySelector('[data-status]').textContent) && /Ang 9/.test(document.querySelector('[data-status]').textContent));
check('next ang works', page.url().includes('ang=9'), page.url());

// 4. Hukamnama.
await load('hukamnama.html');
await page.waitForSelector('.line');
const hukCount = await page.locator('.line').count();
const hukHead = await page.locator('[data-reader-head]').innerText();
check('hukamnama loads verses', hukCount > 0, String(hukCount));
check('hukamnama shows date and source', /\d{4}/.test(hukHead) && hukHead.includes('Ang'), hukHead.replace(/\n/g, ' | '));

// 5. Dasam and Vaaran.
await load('dasam-granth.html');
await page.waitForSelector('.line');
const dasamCount = await page.locator('.line').count();
check('dasam granth loads', dasamCount > 0 && (await page.locator('.reader-raag').count()) >= 0, String(dasamCount));

await load('vaaran.html');
await page.waitForSelector('.line');
const vaarCount = await page.locator('.line').count();
check('vaaran loads by ang', vaarCount > 0, String(vaarCount));

// 6. Taksal (the model) console.
await load('model.html');
const banner = await page.locator('.term-banner').innerText();
check('model banner is exact', banner === 'Taksal (the model) is in development. This console searches sources; it does not generate answers yet.', banner);
const bodyText = await page.locator('body').innerText();
check('model page never says Taksal AI', !/Taksal AI/i.test(bodyText));
check('planned model lists the four rules', /citations/i.test(bodyText) && /Refuse/i.test(bodyText) && /side by side/i.test(bodyText) && /Never invent Gurbani/i.test(bodyText));
check('ascii coin is present', (await page.locator('.term pre').innerText()).includes('_/\\_'));
await page.fill('[data-term-input]', 'har');
await page.press('[data-term-input]', 'Enter');
await page.waitForFunction(() => /matching lines|No matching lines|Search failed/.test(document.querySelector('[data-term-log]').innerText));
const log = await page.locator('[data-term-log]').innerText();
check('console searches BaniDB and cites results', /matching lines/.test(log) && /cite:/.test(log) && /Ang \d+, line \d+/.test(log), log.split('\n').slice(0, 6).join(' | '));
check('console does not claim to generate', !/here is (the|an) answer/i.test(log));

// 7. Library.
await load('library.html');
await page.waitForSelector('.lib-entry');
const libCount = await page.locator('.lib-entry').count();
const badges = await page.locator('.badge').allInnerTexts();
const titles = await page.locator('.lib-title').allInnerTexts();
check('library lists 9 works', libCount === 9, String(libCount));
check('every library entry is marked public domain or in copyright', badges.length === 9 && badges.every((b) => /public domain|in copyright/i.test(b)), badges.join(', '));
check('required works are present', ['Sicques, Tigers, or Thieves', 'Mahan Kosh', 'The Sikh Religion', 'A History of the Sikhs', 'Prachin Panth Prakash', 'Sri Gur Sobha', 'Vaaran Bhai Gurdas', 'Zafarnama', 'Sikh Rehat Maryada'].every((t) => titles.some((x) => x.includes(t))), titles.join(' | '));
check('unverified works show link pending', (await page.locator('.lib-pending').count()) === 3, String(await page.locator('.lib-pending').count()));

// 8. Sign in placeholder.
await load('signin.html');
check('sign in page says it is coming', (await page.locator('.page-intro').innerText()).toLowerCase().includes('coming'));

// 9. Mobile 390px, no horizontal page scroll on every page.
await page.setViewportSize({ width: 390, height: 844 });
for (const path of PAGES) {
  await load(path);
  await page.waitForTimeout(150);
  const metrics = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    client: document.documentElement.clientWidth
  }));
  check(`390px no horizontal scroll: ${path}`, metrics.doc <= metrics.client && metrics.body <= metrics.client, JSON.stringify(metrics));
}

// 10. Offline: block BaniDB, reader must show a clear error plus the bundled sample.
await page.setViewportSize({ width: 1200, height: 900 });
await page.route('**://api.banidb.com/**', (route) => route.abort());
await load('guru-granth-sahib.html');
await page.waitForSelector('.notice');
await page.waitForSelector('.line');
const notice = await page.locator('.notice').innerText();
const offlineCount = await page.locator('.line').count();
const offlineFirst = await page.locator('.line-gurmukhi').first().textContent();
check('offline reader shows a clear error', /Could not load Ang/.test(notice), notice.split('\n')[0]);
check('offline reader shows the bundled sample', offlineCount === 7 && offlineFirst.includes('ਜਤੁ ਪਾਹਾਰਾ'), String(offlineCount));
await page.unroute('**://api.banidb.com/**');

// 11. file:// smoke test: shared data and the offline reader still work.
const fileContext = await browser.newContext({ viewport: { width: 1200, height: 900 } });
await fileContext.route('**://api.banidb.com/**', (route) => route.abort());
const filePage = await fileContext.newPage();
const fileErrors = [];
filePage.on('pageerror', (err) => fileErrors.push(String(err)));
const docsUrl = 'file:///C:/Users/sehaj/taksal/docs/';
await filePage.goto(docsUrl + 'library.html');
await filePage.waitForSelector('.lib-entry');
check('file:// library loads from bundled data', (await filePage.locator('.lib-entry').count()) === 9);
await filePage.goto(docsUrl + 'guru-granth-sahib.html');
await filePage.waitForSelector('.line');
check('file:// reader falls back to the sample', (await filePage.locator('.line').count()) === 7);
check('file:// no page errors', fileErrors.length === 0, fileErrors.join(' | '));
await fileContext.close();

// 12. Favicon and assets.
const favicon = await page.request.get(BASE + '/assets/favicon.svg');
check('favicon served', favicon.status() === 200);
const css = await page.request.get(BASE + '/assets/site.css');
check('stylesheet served', css.status() === 200);

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log('FAILED CHECKS:');
  for (const f of failed) console.log(` - ${f.name} :: ${f.detail}`);
  process.exit(1);
}
