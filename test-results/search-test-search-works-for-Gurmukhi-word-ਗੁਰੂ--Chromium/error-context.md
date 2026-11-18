# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: search-test.spec.ts >> search works for Gurmukhi word "ਗੁਰੂ"
- Location: playwright\tests\search-test.spec.ts:106:1

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - paragraph [ref=f1e2]: Console
  - heading "Taksal (the model)" [level=1] [ref=f1e3]
  - paragraph [ref=f1e4]: A search console over the sources. It finds lines in BaniDB and prints them with citations. It does not write answers.
  - generic [ref=f1e5]:
    - generic [ref=f1e7]:
      - generic [ref=f1e8]: taksal
      - generic [ref=f1e9]: à¨Ÿà¨•à¨¸à¨¾à¨²
    - paragraph [ref=f1e10]: Taksal (the model) is in development. This console searches sources; it does not generate answers yet.
    - log "Console output"
    - generic [ref=f1e11]:
      - text: taksal â–¸
      - textbox "Console command" [ref=f1e12]:
        - /placeholder: search a word, or type help
  - generic [ref=f1e13]:
    - heading "What this is" [level=2] [ref=f1e14]
    - paragraph [ref=f1e15]: An exact and keyword search over BaniDB, served as a console. Type a Gurmukhi word, a romanized word or an English word. Each result is a source line with its ang, line number and verse ID. There is no generated text, no summary and no invented Gurbani.
    - paragraph [ref=f1e16]:
      - text: "Commands:"
      - code [ref=f1e17]: search <words>
      - text: ","
      - code [ref=f1e18]: ang <number>
      - text: ","
      - code [ref=f1e19]: help
      - text: ","
      - code [ref=f1e20]: clear
      - text: . Search is rate limited by BaniDB.
  - generic [ref=f1e21]:
    - heading "The planned model" [level=2] [ref=f1e22]
    - paragraph [ref=f1e23]: "Taksal (the model) is being built to do four things, and only these four:"
    - generic [ref=f1e24]:
      - generic [ref=f1e25]: "Answer only with citations Every sentence in an answer points to a specific source on the site: a shabad line, an ang, a passage in a historical text."
      - generic [ref=f1e26]: Refuse when no source supports an answer If the corpus does not contain support, the model says so instead of guessing.
      - generic [ref=f1e27]: Show traditions side by side Where interpretations differ, the model shows the readings next to each other rather than choosing one for the reader.
      - generic [ref=f1e28]: Never invent Gurbani Gurbani is quoted from the source text, never reconstructed, paraphrased or completed by a model.
  - generic [ref=f1e29]:
    - heading "Why a console first" [level=2] [ref=f1e30]
    - paragraph [ref=f1e31]: Search is the part that can be trusted today. The corpus, the citation layer and an evaluation set of questions with known sources come first. The model is only added once it can be checked against that set.
    - paragraph [ref=f1e32]: Taksal (the model) is not a chatbot.
```

# Test source

```ts
  25  |     await page.goto(url, { waitUntil: 'networkidle' });
  26  | 
  27  |     // Check no horizontal scroll at 390px
  28  |     await page.evaluate(() => {
  29  |       document.documentElement.style.width = '390px';
  30  |       document.documentElement.style.height = '844px';
  31  |     });
  32  |     const horizontalScroll = await page.evaluate(() => {
  33  |       return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  34  |     });
  35  |     expect(horizontalScroll).toBe(false);
  36  | 
  37  |     // Check no console errors
  38  |     const consoleErrors: string[] = [];
  39  |     page.on('console', msg => {
  40  |       if (msg.type() === 'error') {
  41  |         consoleErrors.push(msg.text());
  42  |       }
  43  |     });
  44  |     page.on('pageerror', err => {
  45  |       consoleErrors.push(err.message);
  46  |     });
  47  | 
  48  |     await page.goto(url, { waitUntil: 'networkidle' });
  49  |     await new Promise(r => setTimeout(r, 1000));
  50  | 
  51  |     expect(consoleErrors).toEqual([], `Console errors on ${pageFile}: ${consoleErrors.join(', ')}`);
  52  |     await page.close();
  53  |   }
  54  | 
  55  |   await browser.close();
  56  | });
  57  | 
  58  | test('search works for "Ranjit"', async () => {
  59  |   const browser = await chromium.launch({ headless: false });
  60  |   const context = await browser.newContext({
  61  |     viewport: { width: 1280, height: 720 },
  62  |   });
  63  |   const page = await context.newPage();
  64  |   await page.goto('/pages/model.html', { waitUntil: 'networkidle' });
  65  | 
  66  |   // Wait for search init
  67  |   await page.waitForSelector('#term-input', { state: 'visible', timeout: 5000 });
  68  | 
  69  |   // Search for "Ranjit"
  70  |   await page.fill('#term-input', 'Ranjit');
  71  |   await page.keyboard.press('Enter');
  72  |   await page.waitForTimeout(1000);
  73  | 
  74  |   // Check results appear
  75  |   const termLog = page.locator('.term-log');
  76  |   const resultCount = await termLog.locator('.log-line-gur').count();
  77  |   expect(resultCount).toBeGreaterThan(0, 'Search for "Ranjit" should return results');
  78  | 
  79  |   await browser.close();
  80  | });
  81  | 
  82  | test('search works for "Zafarnama"', async () => {
  83  |   const browser = await chromium.launch({ headless: false });
  84  |   const context = await browser.newContext({
  85  |     viewport: { width: 1280, height: 720 },
  86  |   });
  87  |   const page = await context.newPage();
  88  |   await page.goto('/pages/model.html', { waitUntil: 'networkidle' });
  89  | 
  90  |   // Wait for search init
  91  |   await page.waitForSelector('#term-input', { state: 'visible', timeout: 5000 });
  92  | 
  93  |   // Search for "Zafarnama"
  94  |   await page.fill('#term-input', 'Zafarnama');
  95  |   await page.keyboard.press('Enter');
  96  |   await page.waitForTimeout(1000);
  97  | 
  98  |   // Check results appear
  99  |   const termLog = page.locator('.term-log');
  100 |   const resultCount = await termLog.locator('.log-line-gur').count();
  101 |   expect(resultCount).toBeGreaterThan(0, 'Search for "Zafarnama" should return results');
  102 | 
  103 |   await browser.close();
  104 | });
  105 | 
  106 | test('search works for Gurmukhi word "ਗੁਰੂ"', async () => {
  107 |   const browser = await chromium.launch({ headless: false });
  108 |   const context = await browser.newContext({
  109 |     viewport: { width: 1280, height: 720 },
  110 |   });
  111 |   const page = await context.newPage();
  112 |   await page.goto('/pages/model.html', { waitUntil: 'networkidle' });
  113 | 
  114 |   // Wait for search init
  115 |   await page.waitForSelector('#term-input', { state: 'visible', timeout: 5000 });
  116 | 
  117 |   // Search for Gurmukhi word "ਗੁਰੂ"
  118 |   await page.fill('#term-input', 'ਗੁਰੂ');
  119 |   await page.keyboard.press('Enter');
  120 |   await page.waitForTimeout(1000);
  121 | 
  122 |   // Check results appear
  123 |   const termLog = page.locator('.term-log');
  124 |   const resultCount = await termLog.locator('.log-line-gur').count();
> 125 |   expect(resultCount).toBeGreaterThan(0, 'Search for Gurmukhi "ਗੁਰੂ" should return results');
      |                       ^ Error: expect(received).toBeGreaterThan(expected)
  126 | 
  127 |   await browser.close();
  128 | });
```